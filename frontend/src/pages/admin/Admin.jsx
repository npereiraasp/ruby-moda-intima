import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiSettings, FiLogOut, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiCheck, FiX } from 'react-icons/fi';
import { RiDiamondLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

// ─── Admin Layout ─────────────────────────────────────────────
export function AdminLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) { navigate('/'); }
  }, [isAdmin]);

  const nav = [
    { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/admin/produtos', label: 'Produtos', icon: FiPackage },
    { to: '/admin/pedidos', label: 'Pedidos', icon: FiShoppingBag },
    { to: '/admin/clientes', label: 'Clientes', icon: FiUsers },
    { to: '/admin/configuracoes', label: 'Configurações', icon: FiSettings },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0 fixed h-full z-30">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ruby-600 rounded-full flex items-center justify-center">
              <RiDiamondLine className="text-white" size={18} />
            </div>
            <div>
              <span className="font-display text-base font-semibold text-white block leading-tight">Ruby Admin</span>
              <span className="text-xs text-gray-400">Painel Administrativo</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
                  isActive ? 'bg-ruby-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-400 font-body">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all">
            <FiLogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────
export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STATUS_LABELS = {
    pending: 'Aguardando', payment_pending: 'Aguardando pagamento',
    paid: 'Pago', processing: 'Processando', shipped: 'Enviado',
    delivered: 'Entregue', cancelled: 'Cancelado'
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-7">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-28 animate-pulse bg-white" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Pedidos (30 dias)', value: stats?.orders_this_month || 0, icon: FiShoppingBag, color: 'bg-blue-50 text-blue-600' },
              { label: 'Receita (30 dias)', value: formatPrice(stats?.revenue_this_month), icon: RiDiamondLine, color: 'bg-green-50 text-green-600' },
              { label: 'Clientes', value: stats?.total_clients || 0, icon: FiUsers, color: 'bg-purple-50 text-purple-600' },
              { label: 'Produtos Ativos', value: stats?.active_products || 0, icon: FiPackage, color: 'bg-ruby-50 text-ruby-600' },
            ].map((stat, i) => (
              <div key={i} className="card p-5 bg-white">
                <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={20} />
                </div>
                <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 font-body mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="card p-6 bg-white">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-body font-semibold text-gray-900 text-lg">Pedidos Recentes</h2>
              <Link to="/admin/pedidos" className="text-sm text-ruby-600 font-medium hover:text-ruby-700">Ver todos →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedido</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(stats?.recent_orders || []).map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">#{order.id.slice(0,8).toUpperCase()}</td>
                      <td className="py-3 text-gray-600">{order.customer_name}</td>
                      <td className="py-3">
                        <span className="badge bg-gray-100 text-gray-700">
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Admin Products ───────────────────────────────────────────
const defaultProduct = {
  name: '', category_id: '', description: '', short_description: '',
  price: '', promotional_price: '', sku: '', featured: false,
  images: [{ url: '', alt_text: '' }],
  variants: [{ color_name: '', color_hex: '#C0392B', size: '', stock_quantity: 0 }]
};

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultProduct);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/products?limit=100'),
      api.get('/api/products/categories')
    ]).then(([p, c]) => {
      setProducts(p.data.products);
      setCategories(c.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultProduct);
    setModal(true);
  };

  const openEdit = async (product) => {
    const res = await api.get(`/api/products/${product.id}`);
    const p = res.data;
    setForm({
      name: p.name, category_id: p.category_id || '',
      description: p.description, short_description: p.short_description || '',
      price: p.price, promotional_price: p.promotional_price || '',
      sku: p.sku || '', featured: p.featured,
      images: p.images.length > 0 ? p.images.map(i => ({url: i.url, alt_text: i.alt_text})) : [{ url: '', alt_text: '' }],
      variants: p.variants.length > 0 ? p.variants : [{ color_name: '', color_hex: '#C0392B', size: '', stock_quantity: 0 }]
    });
    setEditing(p.id);
    setModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remover "${name}"?`)) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Produto removido');
      loadData();
    } catch { toast.error('Erro ao remover'); }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Nome e preço são obrigatórios'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        images: form.images.filter(i => i.url),
        variants: form.variants.filter(v => v.color_name || v.size)
      };
      if (editing) {
        await api.put(`/api/products/${editing}`, payload);
        toast.success('Produto atualizado!');
      } else {
        await api.post('/api/products', payload);
        toast.success('Produto criado!');
      }
      setModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Variant/Image helpers
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { color_name: '', color_hex: '#C0392B', size: '', stock_quantity: 0 }] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i, key, val) => setForm(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [key]: val } : v) }));
  const addImage = () => setForm(f => ({ ...f, images: [...f.images, { url: '', alt_text: '' }] }));
  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const updateImage = (i, key, val) => setForm(f => ({ ...f, images: f.images.map((img, idx) => idx === i ? { ...img, [key]: val } : img) }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-display text-3xl font-semibold text-gray-900">Produtos</h1>
        <button onClick={openCreate} className="btn-ruby flex items-center gap-2">
          <FiPlus size={18} /> Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse text-center text-gray-400">Carregando...</div>
      ) : (
        <div className="card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Produto','Categoria','Preço','Status','Ações'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.primary_image
                          ? <img src={p.primary_image} alt="" className="w-10 h-12 object-cover rounded-lg" />
                          : <div className="w-10 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg">👗</div>
                        }
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          {p.featured && <span className="badge bg-gold/20 text-yellow-700 text-[10px]">⭐ Destaque</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{p.category_name || '—'}</td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-semibold text-gray-900">{formatPrice(p.promotional_price || p.price)}</span>
                        {p.promotional_price && (
                          <span className="text-gray-400 text-xs line-through ml-1">{formatPrice(p.price)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${p.active ? 'badge-success' : 'badge bg-red-100 text-red-700'}`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-gray-500 hover:text-ruby-600 hover:bg-ruby-50 rounded-lg transition-all" title="Editar">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Remover">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhum produto cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display text-2xl font-semibold text-gray-900">
                {editing ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><FiX size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-ruby">Nome do Produto *</label>
                  <input className="input-ruby" placeholder="Nome do produto" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div>
                  <label className="label-ruby">Categoria</label>
                  <select className="input-ruby" value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}>
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-ruby">SKU</label>
                  <input className="input-ruby" placeholder="SKU-001" value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))} />
                </div>
                <div>
                  <label className="label-ruby">Preço (R$) *</label>
                  <input type="number" step="0.01" min="0" className="input-ruby" placeholder="59.90" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
                </div>
                <div>
                  <label className="label-ruby">Preço Promocional (R$)</label>
                  <input type="number" step="0.01" min="0" className="input-ruby" placeholder="49.90" value={form.promotional_price} onChange={e => setForm(f => ({...f, promotional_price: e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="label-ruby">Descrição Curta</label>
                  <input className="input-ruby" placeholder="Breve descrição (exibida na listagem)" value={form.short_description} onChange={e => setForm(f => ({...f, short_description: e.target.value}))} maxLength={300} />
                </div>
                <div className="col-span-2">
                  <label className="label-ruby">Descrição Completa</label>
                  <textarea className="input-ruby resize-none" rows={4} placeholder="Descrição detalhada do produto..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="accent-ruby-600 w-4 h-4" />
                    <span className="text-sm font-body text-gray-700">Produto em destaque (exibir na home)</span>
                  </label>
                </div>
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-body font-medium text-gray-900">Imagens</label>
                  <button onClick={addImage} className="text-sm text-ruby-600 hover:text-ruby-700 font-medium flex items-center gap-1">
                    <FiPlus size={14} /> Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="input-ruby flex-1" placeholder="URL da imagem (https://...)" value={img.url} onChange={e => updateImage(i, 'url', e.target.value)} />
                      <input className="input-ruby w-40" placeholder="Texto alternativo" value={img.alt_text} onChange={e => updateImage(i, 'alt_text', e.target.value)} />
                      {form.images.length > 1 && (
                        <button onClick={() => removeImage(i)} className="text-gray-400 hover:text-red-500 p-2"><FiTrash2 size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Cole a URL direta da imagem. A primeira imagem será a principal.</p>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-body font-medium text-gray-900">Variantes (Cores e Tamanhos)</label>
                  <button onClick={addVariant} className="text-sm text-ruby-600 hover:text-ruby-700 font-medium flex items-center gap-1">
                    <FiPlus size={14} /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-center">
                      <input className="input-ruby col-span-1" placeholder="Cor" value={v.color_name} onChange={e => updateVariant(i, 'color_name', e.target.value)} />
                      <div className="flex items-center gap-1 col-span-1">
                        <input type="color" className="w-8 h-9 cursor-pointer rounded border border-gray-200" value={v.color_hex} onChange={e => updateVariant(i, 'color_hex', e.target.value)} />
                        <input className="input-ruby flex-1 text-xs" placeholder="#hex" value={v.color_hex} onChange={e => updateVariant(i, 'color_hex', e.target.value)} />
                      </div>
                      <input className="input-ruby col-span-1" placeholder="Tam. (44, 46...)" value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} />
                      <input type="number" className="input-ruby col-span-1" placeholder="Estoque" min="0" value={v.stock_quantity} onChange={e => updateVariant(i, 'stock_quantity', parseInt(e.target.value) || 0)} />
                      {form.variants.length > 1 && (
                        <button onClick={() => removeVariant(i)} className="text-gray-400 hover:text-red-500 p-2 col-span-1"><FiTrash2 size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModal(false)} className="btn-outline flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-ruby flex-1">
                {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Orders ─────────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const STATUS_OPTIONS = [
    {v:'',l:'Todos'},{v:'pending',l:'Pendente'},{v:'payment_pending',l:'Aguard. Pgto'},
    {v:'paid',l:'Pago'},{v:'processing',l:'Processando'},{v:'shipped',l:'Enviado'},
    {v:'delivered',l:'Entregue'},{v:'cancelled',l:'Cancelado'}
  ];

  useEffect(() => {
    setLoading(true);
    api.get(`/api/orders/admin/all${status ? `?status=${status}` : ''}`)
      .then(r => setOrders(r.data.orders || []))
      .finally(() => setLoading(false));
  }, [status]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus} : o));
      toast.success('Status atualizado!');
    } catch { toast.error('Erro ao atualizar'); }
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-7">Pedidos</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button key={s.v} onClick={() => setStatus(s.v)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-all font-body ${status === s.v ? 'bg-ruby-600 text-white border-ruby-600' : 'border-gray-200 text-gray-600 hover:border-ruby-300'}`}>
            {s.l}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden bg-white">
        <table className="w-full text-sm font-body">
          <thead className="border-b border-gray-100">
            <tr>
              {['Pedido','Cliente','Data','Pagamento','Status','Total','Ações'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum pedido</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-900">#{o.id.slice(0,8).toUpperCase()}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{o.customer_name}</p>
                  <p className="text-xs text-gray-500">{o.customer_email}</p>
                </td>
                <td className="px-5 py-4 text-gray-500">{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-5 py-4">
                  <span className="badge bg-gray-100 text-gray-700">
                    {o.payment_method === 'pix' ? 'PIX' : 'Cartão'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ruby-300 bg-white"
                    style={{minWidth: '130px'}}
                  >
                    {STATUS_OPTIONS.slice(1).map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </td>
                <td className="px-5 py-4 font-semibold text-gray-900">{formatPrice(o.total)}</td>
                <td className="px-5 py-4">
                  <Link to={`/admin/pedidos/${o.id}`} className="text-ruby-600 hover:text-ruby-700 text-xs font-medium">Detalhes</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Admin Clients ────────────────────────────────────────────
export function AdminClients() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/users')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-7">Clientes</h1>
      <div className="card overflow-hidden bg-white">
        <table className="w-full text-sm font-body">
          <thead className="border-b border-gray-100">
            <tr>
              {['Nome','E-mail','CPF','Telefone','Tipo','Desde'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-4 text-gray-600">{u.email}</td>
                <td className="px-5 py-4 text-gray-600">{u.cpf}</td>
                <td className="px-5 py-4 text-gray-600">{u.phone || '—'}</td>
                <td className="px-5 py-4">
                  <span className={`badge ${u.role === 'admin' ? 'badge-ruby' : 'badge-info'}`}>{u.role === 'admin' ? 'Admin' : 'Cliente'}</span>
                </td>
                <td className="px-5 py-4 text-gray-500">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Admin Settings ───────────────────────────────────────────
export function AdminSettings() {
  const [form, setForm] = useState({
    company_name: '', logo_url: '', tagline: '', contact_email: '', contact_phone: '',
    instagram_url: '', whatsapp_number: '', pix_key: '', pix_key_type: 'email'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      const s = r.data;
      setForm({
        company_name: s.company_name || '', logo_url: s.logo_url || '',
        tagline: s.tagline || '', contact_email: s.contact_email || '',
        contact_phone: s.contact_phone || '', instagram_url: s.instagram_url || '',
        whatsapp_number: s.whatsapp_number || '', pix_key: s.pix_key || '',
        pix_key_type: s.pix_key_type || 'email'
      });
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings', form);
      toast.success('Configurações salvas!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-gray-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-7">Configurações</h1>

      <div className="card p-7 bg-white space-y-6">
        {/* Brand */}
        <div>
          <h3 className="font-body font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Identidade da Marca</h3>
          <div className="space-y-4">
            <div>
              <label className="label-ruby">Nome da Empresa</label>
              <input className="input-ruby" value={form.company_name} onChange={e => setForm(f => ({...f, company_name: e.target.value}))} />
            </div>
            <div>
              <label className="label-ruby">Tagline / Slogan</label>
              <input className="input-ruby" placeholder="Sua mensagem de marca" value={form.tagline} onChange={e => setForm(f => ({...f, tagline: e.target.value}))} />
            </div>
            <div>
              <label className="label-ruby">URL da Logo</label>
              <input className="input-ruby" placeholder="https://..." value={form.logo_url} onChange={e => setForm(f => ({...f, logo_url: e.target.value}))} />
              {form.logo_url && <img src={form.logo_url} alt="Logo preview" className="mt-2 h-12 object-contain rounded" onError={e => e.target.style.display='none'} />}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-body font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Contato e Redes Sociais</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-ruby">E-mail de Contato</label>
                <input type="email" className="input-ruby" value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} />
              </div>
              <div>
                <label className="label-ruby">Telefone</label>
                <input className="input-ruby" placeholder="(00) 0000-0000" value={form.contact_phone} onChange={e => setForm(f => ({...f, contact_phone: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="label-ruby">Instagram</label>
              <input className="input-ruby" placeholder="https://instagram.com/..." value={form.instagram_url} onChange={e => setForm(f => ({...f, instagram_url: e.target.value}))} />
            </div>
            <div>
              <label className="label-ruby">WhatsApp (número com DDD)</label>
              <input className="input-ruby" placeholder="11999999999" value={form.whatsapp_number} onChange={e => setForm(f => ({...f, whatsapp_number: e.target.value}))} />
            </div>
          </div>
        </div>

        {/* PIX */}
        <div>
          <h3 className="font-body font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Configurações de Pagamento PIX</h3>
          <div className="space-y-4">
            <div>
              <label className="label-ruby">Tipo de Chave PIX</label>
              <select className="input-ruby" value={form.pix_key_type} onChange={e => setForm(f => ({...f, pix_key_type: e.target.value}))}>
                <option value="email">E-mail</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            <div>
              <label className="label-ruby">Chave PIX</label>
              <input className="input-ruby" placeholder="Sua chave PIX" value={form.pix_key} onChange={e => setForm(f => ({...f, pix_key: e.target.value}))} />
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-ruby w-full py-4 text-base">
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  return <AdminLayout />;
}
