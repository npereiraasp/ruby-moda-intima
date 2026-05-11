-- ============================================================
-- RUBY MODA ÍNTIMA - Database Schema
-- PostgreSQL - Railway
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'client', -- 'client' | 'admin'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Principal',
  cep VARCHAR(9) NOT NULL,
  street VARCHAR(200) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(150) DEFAULT 'Ruby - Moda Íntima',
  logo_url TEXT,
  tagline TEXT DEFAULT 'Beleza sem limites, conforto em cada tamanho',
  primary_color VARCHAR(7) DEFAULT '#C0392B',
  secondary_color VARCHAR(7) DEFAULT '#F5C6CB',
  contact_email VARCHAR(150),
  contact_phone VARCHAR(20),
  instagram_url TEXT,
  whatsapp_number VARCHAR(20),
  pix_key TEXT,
  pix_key_type VARCHAR(20),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Sutiãs', 'sutias', 'Sutiãs plus size confortáveis e elegantes'),
  ('Calcinhas', 'calcinhas', 'Calcinhas em diversos modelos e tecidos'),
  ('Conjuntos', 'conjuntos', 'Conjuntos coordenados íntimos'),
  ('Camisolas', 'camisolas', 'Camisolas e babydolls sensuais e confortáveis'),
  ('Pijamas', 'pijamas', 'Pijamas macios e estilosos'),
  ('Acessórios', 'acessorios', 'Acessórios e complementos')
ON CONFLICT DO NOTHING;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(300),
  price DECIMAL(10,2) NOT NULL,
  promotional_price DECIMAL(10,2),
  sku VARCHAR(100),
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

-- PRODUCT VARIANTS (colors + sizes)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(50),
  color_hex VARCHAR(7),
  size VARCHAR(20),
  stock_quantity INT DEFAULT 0,
  sku_variant VARCHAR(100),
  active BOOLEAN DEFAULT true
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  address_id UUID REFERENCES addresses(id),
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | payment_pending | paid | processing | shipped | delivered | cancelled | refunded
  payment_method VARCHAR(20) NOT NULL, -- 'pix' | 'credit_card'
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending | paid | failed | refunded
  payment_id VARCHAR(200), -- Mercado Pago payment ID
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name VARCHAR(200) NOT NULL,
  color_name VARCHAR(50),
  size VARCHAR(20),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
