require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://ruby-moda-intima.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ──────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const { favRouter, settingsRouter, adminRouter } = require('./routes/extras');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ─── Init DB & Start ──────────────────────────────────────────
async function initDB() {
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema applied');

    // Create default admin if not exists
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ruby.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, 12);
      await pool.query(
        "INSERT INTO users (name, email, password_hash, cpf, role) VALUES ($1,$2,$3,$4,'admin')",
        ['Administrador', adminEmail, hash, '000.000.000-00']
      );
      console.log(`✅ Admin criado: ${adminEmail} / ${adminPass}`);
    }
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🌹 Ruby API rodando na porta ${PORT}`);
  });
});
