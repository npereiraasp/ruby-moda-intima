const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { authenticate, generateToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, cpf, phone } = req.body;

    if (!name || !email || !password || !cpf) {
      return res.status(400).json({ error: 'Nome, e-mail, senha e CPF são obrigatórios' });
    }

    const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const cpfExists = await pool.query('SELECT id FROM users WHERE cpf = $1', [cpf]);
    if (cpfExists.rows.length > 0) {
      return res.status(409).json({ error: 'CPF já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, cpf, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, cpf, phone, role`,
      [name, email.toLowerCase(), hash, cpf, phone || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash, cpf, phone, role, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const { password_hash, ...userSafe } = user;
    const token = generateToken(user.id);

    res.json({ user: userSafe, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const addresses = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC',
      [req.user.id]
    );
    res.json({ user: req.user, addresses: addresses.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users SET name=$1, phone=$2, avatar_url=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id, name, email, cpf, phone, role, avatar_url`,
      [name || req.user.name, phone || null, avatar_url || null, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

// POST /api/auth/address
router.post('/address', authenticate, async (req, res) => {
  try {
    const { label, cep, street, number, complement, neighborhood, city, state, is_default } = req.body;

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
    }

    const result = await pool.query(
      `INSERT INTO addresses (user_id, label, cep, street, number, complement, neighborhood, city, state, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, label || 'Principal', cep, street, number, complement || null, neighborhood, city, state, is_default || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar endereço' });
  }
});

// DELETE /api/auth/address/:id
router.delete('/address/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Endereço removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover endereço' });
  }
});

module.exports = router;
