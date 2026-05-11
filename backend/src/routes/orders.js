const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

// POST /api/orders - Create order
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { items, address_id, payment_method, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }
    if (!payment_method || !['pix', 'credit_card'].includes(payment_method)) {
      return res.status(400).json({ error: 'Método de pagamento inválido' });
    }

    // Calculate totals and check stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const prodRes = await client.query(
        'SELECT p.*, pv.stock_quantity, pv.color_name, pv.size FROM products p LEFT JOIN product_variants pv ON pv.id = $2 WHERE p.id = $1',
        [item.product_id, item.variant_id || null]
      );
      if (prodRes.rows.length === 0) {
        throw new Error(`Produto não encontrado: ${item.product_id}`);
      }
      const prod = prodRes.rows[0];
      if (prod.stock_quantity !== null && prod.stock_quantity < item.quantity) {
        throw new Error(`Estoque insuficiente para: ${prod.name}`);
      }

      const unitPrice = parseFloat(prod.promotional_price || prod.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: prod.name,
        color_name: prod.color_name,
        size: prod.size,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: itemSubtotal
      });
    }

    const shippingCost = subtotal >= 200 ? 0 : 15.90; // Free shipping above R$200
    const total = subtotal + shippingCost;

    // Create order
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, address_id, payment_method, subtotal, shipping_cost, total, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, address_id || null, payment_method, subtotal, shippingCost, total, notes || null]
    );
    const order = orderRes.rows[0];

    // Insert order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, color_name, size, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [order.id, item.product_id, item.variant_id, item.product_name, item.color_name, item.size, item.quantity, item.unit_price, item.subtotal]
      );

      // Deduct stock if variant exists
      if (item.variant_id) {
        await client.query(
          'UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.variant_id]
        );
      }
    }

    await client.query('COMMIT');

    // Process payment
    if (payment_method === 'pix') {
      // Get site settings for PIX key
      const settingsRes = await pool.query('SELECT pix_key, pix_key_type, company_name FROM site_settings WHERE id=1');
      const settings = settingsRes.rows[0];

      // Generate PIX QR Code (integrate with Mercado Pago in production)
      // For now, store PIX info
      const pixExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        `UPDATE orders SET status='payment_pending', pix_expires_at=$1 WHERE id=$2`,
        [pixExpiresAt, order.id]
      );

      const updatedOrder = await getOrderFull(order.id);
      updatedOrder.pix_info = {
        key: settings?.pix_key,
        key_type: settings?.pix_key_type,
        beneficiary: settings?.company_name,
        amount: total,
        expires_at: pixExpiresAt,
        description: `Pedido #${order.id.slice(0, 8).toUpperCase()}`
      };

      return res.status(201).json(updatedOrder);
    }

    const fullOrder = await getOrderFull(order.id);
    res.status(201).json(fullOrder);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order error:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar pedido' });
  } finally {
    client.release();
  }
});

// GET /api/orders - User's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'product_name', oi.product_name,
          'color_name', oi.color_name,
          'size', oi.size,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal
        )) as items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// GET /api/orders/:id - Single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await getOrderFull(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// ============ ADMIN ROUTES ============

// GET /api/orders/admin/all - All orders (admin)
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = status ? `WHERE o.status = '${status}'` : '';

    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query(`SELECT COUNT(*) FROM orders o ${where}`);
    res.json({ orders: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// PUT /api/orders/:id/status - Update order status (admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await pool.query(
      'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

async function getOrderFull(orderId) {
  const orderRes = await pool.query('SELECT * FROM orders WHERE id=$1', [orderId]);
  if (orderRes.rows.length === 0) return null;
  const order = orderRes.rows[0];
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [orderId]);
  order.items = itemsRes.rows;
  return order;
}

module.exports = router;
