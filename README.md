# Ruby - Moda Íntima 💎

E-commerce de moda íntima feminina plus size (tamanhos 44–60).

---

## Stack Técnica

| Camada | Tecnologia | Hospedagem |
|--------|------------|------------|
| Frontend | React + Tailwind CSS + Vite | Vercel |
| Backend | Node.js + Express | Railway |
| Banco de dados | PostgreSQL | Railway |
| Autenticação | JWT | — |
| Pagamentos | PIX + Cartão (Mercado Pago) | — |

---

## Estrutura do Projeto

```
ruby-moda-intima/
├── backend/    → API REST (Railway)
└── frontend/   → Interface React (Vercel)
```

---

## 🚀 Deploy Passo a Passo

### 1. Preparar o repositório Git

```bash
# Na raiz do projeto
git init
git add .
git commit -m "feat: Ruby Moda Íntima - initial commit"

# Criar repo no GitHub e fazer push
git remote add origin https://github.com/SEU_USUARIO/ruby-moda-intima.git
git push -u origin main
```

---

### 2. Backend no Railway

1. Acesse [railway.app](https://railway.app) e crie uma conta
2. Clique em **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório `ruby-moda-intima`
4. Railway detectará o `railway.toml` automaticamente — defina o **Root Directory** como `backend`
5. No projeto Railway, adicione o plugin **PostgreSQL**:
   - Clique em **+ Add Plugin** → **PostgreSQL**
   - A variável `DATABASE_URL` será gerada automaticamente
6. Vá em **Variables** e adicione:

```env
PORT=3001
JWT_SECRET=sua_chave_secreta_muito_forte_aqui_mude_isso
FRONTEND_URL=https://ruby-moda.vercel.app   # altere após deploy do frontend
ADMIN_EMAIL=admin@ruby.com
ADMIN_PASSWORD=SuaSenhaAdmin@123
API_URL=https://seu-backend.railway.app
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...      # opcional, para pagamentos reais
```

7. O Railway fará deploy automático. Anote a URL gerada (ex: `https://ruby-backend-production.railway.app`)

---

### 3. Frontend no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New Project** → importe o repositório `ruby-moda-intima`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
4. Em **Environment Variables**, adicione:

```env
VITE_API_URL=https://ruby-backend-production.railway.app/api
```
   (use a URL do Railway do passo anterior)

5. Clique em **Deploy**

---

### 4. Conectar frontend ↔ backend

Após o Vercel gerar a URL do frontend (ex: `https://ruby-moda.vercel.app`), volte ao Railway e atualize a variável:

```env
FRONTEND_URL=https://ruby-moda.vercel.app
```

---

## Credenciais padrão de Admin

```
E-mail: admin@ruby.com
Senha:  Admin@123
```

**⚠️ Altere imediatamente após o primeiro login!**

Acesse o painel em: `https://seu-site.vercel.app/admin`

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | String de conexão PostgreSQL (Railway) | ✅ |
| `PORT` | Porta do servidor (padrão: 3001) | ✅ |
| `JWT_SECRET` | Chave secreta para tokens JWT | ✅ |
| `FRONTEND_URL` | URL do frontend (para CORS) | ✅ |
| `ADMIN_EMAIL` | E-mail do admin padrão | ✅ |
| `ADMIN_PASSWORD` | Senha do admin padrão | ✅ |
| `API_URL` | URL da API (para imagens) | ✅ |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token do Mercado Pago | Opcional |

### Frontend (`frontend/.env`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL completa da API backend |

---

## API — Principais Endpoints

### Autenticação
- `POST /api/auth/register` — Cadastro
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Dados do usuário logado
- `PUT /api/auth/update` — Atualizar perfil/senha
- `GET /api/auth/addresses` — Listar endereços
- `POST /api/auth/addresses` — Adicionar endereço
- `PUT /api/auth/addresses/:id` — Editar endereço
- `DELETE /api/auth/addresses/:id` — Remover endereço

### Produtos
- `GET /api/products` — Listar (suporta `?category=&search=&page=`)
- `GET /api/products/:id` — Detalhe do produto
- `GET /api/products/categories` — Listar categorias
- `POST /api/products` — Criar produto (admin)
- `PUT /api/products/:id` — Atualizar produto (admin)
- `DELETE /api/products/:id` — Remover produto (admin)

### Pedidos
- `POST /api/orders` — Criar pedido
- `GET /api/orders` — Meus pedidos
- `GET /api/orders/admin/all` — Todos os pedidos (admin)
- `PUT /api/orders/:id/status` — Atualizar status (admin)

### Favoritos
- `GET /api/favorites` — Meus favoritos
- `POST /api/favorites/:productId` — Favoritar
- `DELETE /api/favorites/:productId` — Desfavoritar

### Admin
- `GET /api/admin/stats` — Estatísticas do dashboard
- `GET /api/admin/users` — Lista de clientes
- `GET /api/settings` — Configurações do site
- `PUT /api/settings` — Atualizar configurações

---

## Desenvolvimento Local

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edite .env com sua conexão PostgreSQL local
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edite .env: VITE_API_URL=http://localhost:3001/api
npm run dev
```

---

## Integração de Pagamentos (Mercado Pago)

Para pagamentos reais em produção:

1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Obtenha o `ACCESS_TOKEN` de produção
3. Configure na variável `MERCADO_PAGO_ACCESS_TOKEN` do Railway
4. Para PIX: a API gerará QR codes reais automaticamente
5. Para cartão: implemente o [Mercado Pago Bricks](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/landing) no frontend para tokenização segura

---

## Categorias Padrão

- Sutiãs
- Calcinhas  
- Conjuntos
- Camisolas
- Pijamas
- Acessórios

---

## Tamanhos Disponíveis

44 · 46 · 48 · 50 · 52 · 54 · 56 · 58 · 60

---

## Frete

- Grátis acima de **R$ 200,00**
- Taxa de **R$ 15,90** abaixo desse valor

---

Feito com ❤️ para Ruby Moda Íntima
