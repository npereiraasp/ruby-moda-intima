const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for local uploads (use Cloudinary/S3 in production)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: get full product with variants and images
async function getProductFull(productId) {
  const [prodRes, imgRes, varRes] = await Promise.all([
    pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [productId]),
    pool.query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order', [productId]),
    pool.query('SELECT * FROM product_variants WHERE product_id = $1 AND active = true ORDER BY color_name, size', [productId])
  ]);
  if (prodRes.rows.length === 0) return null;
  const product = prodRes.rows[0];
  product.images = imgRes.rows;
  product.variants = varRes.rows;
  return product;
}

// GET /api/products - List products (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 12, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    let where = ['p.active = true'];
    let params = [];
    let i = 1;

    if (category) {
      where.push(`c.slug = $${i++}`);
      params.push(category);
    }
    if (featured === 'true') {
      where.push(`p.featured = true`);
    }
    if (search) {
      where.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const sortMap = {
      created_at: 'p.created_at DESC',
      price_asc: 'COALESCE(p.promotional_price, p.price) ASC',
      price_desc: 'COALESCE(p.promotional_price, p.price) DESC',
      name: 'p.name ASC'
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    params.push(limit, offset);

    const [products, countRes] = await Promise.all([
      pool.query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug,
               (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image,
               (SELECT json_agg(DISTINCT color_name) FROM product_variants WHERE product_id = p.id AND active = true AND color_name IS NOT NULL) as colors,
               (SELECT json_agg(DISTINCT size) FROM product_variants WHERE product_id = p.id AND active = true AND size IS NOT NULL) as sizes
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereStr}
        ORDER BY ${orderBy}
        LIMIT $${i++} OFFSET $${i++}
      `, params),
      pool.query(`
        SELECT COUNT(*) FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereStr}
      `, params.slice(0, -2))
    ]);

    res.json({
      products: products.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET /api/products/categories - List categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE active = true ORDER BY sort_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// GET /api/products/:id - Single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await getProductFull(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    // Check if favorited
    if (req.user) {
      const fav = await pool.query(
        'SELECT id FROM favorites WHERE user_id=$1 AND product_id=$2',
        [req.user.id, req.params.id]
      );
      product.is_favorited = fav.rows.length > 0;
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// ============ ADMIN ROUTES ============

// POST /api/products - Create product (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      category_id, name, description, short_description,
      price, promotional_price, sku, featured, variants, images
    } = req.body;

    const slug = name.toLowerCase()
      .replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o')
      .replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      + '-' + Date.now();

    const productRes = await pool.query(
      `INSERT INTO products (category_id, name, slug, description, short_description, price, promotional_price, sku, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [category_id || null, name, slug, description, short_description || null,
       price, promotional_price || null, sku || null, featured || false]
    );

    const product = productRes.rows[0];

    if (variants && variants.length > 0) {
      for (const v of variants) {
        await pool.query(
          'INSERT INTO product_variants (product_id, color_name, color_hex, size, stock_quantity) VALUES ($1,$2,$3,$4,$5)',
          [product.id, v.color_name, v.color_hex, v.size, v.stock_quantity || 0]
        );
      }
    }

    if (images && images.length > 0) {
      for (let j = 0; j < images.length; j++) {
        await pool.query(
          'INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [product.id, images[j].url, images[j].alt_text || name, j === 0, j]
        );
      }
    }

    const full = await getProductFull(product.id);
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /api/products/:id - Update product (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      category_id, name, description, short_description,
      price, promotional_price, sku, featured, active, variants, images
    } = req.body;

    await pool.query(
      `UPDATE products SET category_id=$1, name=$2, description=$3, short_description=$4,
       price=$5, promotional_price=$6, sku=$7, featured=$8, active=$9, updated_at=NOW()
       WHERE id=$10`,
      [category_id || null, name, description, short_description || null,
       price, promotional_price || null, sku || null,
       featured ?? false, active ?? true, req.params.id]
    );

    if (variants) {
      await pool.query('DELETE FROM product_variants WHERE product_id=$1', [req.params.id]);
      for (const v of variants) {
        await pool.query(
          'INSERT INTO product_variants (product_id, color_name, color_hex, size, stock_quantity) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, v.color_name, v.color_hex, v.size, v.stock_quantity || 0]
        );
      }
    }

    if (images) {
      await pool.query('DELETE FROM product_images WHERE product_id=$1', [req.params.id]);
      for (let j = 0; j < images.length; j++) {
        await pool.query(
          'INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, images[j].url, images[j].alt_text || '', j === 0, j]
        );
      }
    }

    const full = await getProductFull(req.params.id);
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/products/:id - Delete product (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Produto removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

// POST /api/products/upload-image - Upload image (admin)
router.post('/upload-image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const url = `${process.env.API_URL || ''}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

module.exports = router;
