const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ============ FAVORITES ============

const favRouter = require('express').Router();

// GET /api/favorites
favRouter.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as primary_image,
              f.id as favorite_id
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

// POST /api/favorites/:productId
favRouter.post('/:productId', authenticate, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.productId]
    );
    res.json({ favorited: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao favoritar' });
  }
});

// DELETE /api/favorites/:productId
favRouter.delete('/:productId', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id=$1 AND product_id=$2',
      [req.user.id, req.params.productId]
    );
    res.json({ favorited: false });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// ============ SETTINGS (admin) ============

const settingsRouter = require('express').Router();

// GET /api/settings
settingsRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings WHERE id=1');
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT /api/settings (admin only)
settingsRouter.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      company_name, logo_url, tagline, primary_color, secondary_color,
      contact_email, contact_phone, instagram_url, whatsapp_number,
      pix_key, pix_key_type
    } = req.body;

    const result = await pool.query(
      `UPDATE site_settings SET
        company_name = COALESCE($1, company_name),
        logo_url = COALESCE($2, logo_url),
        tagline = COALESCE($3, tagline),
        primary_color = COALESCE($4, primary_color),
        secondary_color = COALESCE($5, secondary_color),
        contact_email = COALESCE($6, contact_email),
        contact_phone = COALESCE($7, contact_phone),
        instagram_url = COALESCE($8, instagram_url),
        whatsapp_number = COALESCE($9, whatsapp_number),
        pix_key = COALESCE($10, pix_key),
        pix_key_type = COALESCE($11, pix_key_type),
        updated_at = NOW()
       WHERE id = 1 RETURNING *`,
      [company_name, logo_url, tagline, primary_color, secondary_color,
       contact_email, contact_phone, instagram_url, whatsapp_number, pix_key, pix_key_type]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// ============ ADMIN DASHBOARD STATS ============

const adminRouter = require('express').Router();

adminRouter.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [ordersRes, revenueRes, usersRes, productsRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '30 days'"),
      pool.query("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE payment_status='paid' AND created_at > NOW() - INTERVAL '30 days'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role='client'"),
      pool.query("SELECT COUNT(*) FROM products WHERE active=true")
    ]);

    const recentOrders = await pool.query(
      `SELECT o.id, o.total, o.status, o.payment_method, o.created_at, u.name as customer_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 5`
    );

    res.json({
      orders_this_month: parseInt(ordersRes.rows[0].count),
      revenue_this_month: parseFloat(revenueRes.rows[0].total),
      total_clients: parseInt(usersRes.rows[0].count),
      active_products: parseInt(productsRes.rows[0].count),
      recent_orders: recentOrders.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, cpf, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

module.exports = { favRouter, settingsRouter, adminRouter };
