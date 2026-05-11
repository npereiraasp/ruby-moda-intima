import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiPackage, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ProductCard from '../components/ui/ProductCard';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const STATUS_LABELS = {
  pending: { label: 'Aguardando', color: 'badge-warning' },
  payment_pending: { label: 'Aguardando Pagamento', color: 'badge-warning' },
  paid: { label: 'Pago', color: 'badge-success' },
  processing: { label: 'Em Processamento', color: 'badge-info' },
  shipped: { label: 'Enviado', color: 'badge-info' },
  delivered: { label: 'Entregue', color: 'badge-success' },
  cancelled: { label: 'Cancelado', color: 'badge bg-red-100 text-red-700' },
  refunded: { label: 'Reembolsado', color: 'badge bg-gray-100 text-gray-700' },
};

export function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/api/favorites')
      .then(r => setFavorites(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="page-container py-8">
      <div className="flex items-center gap-3 mb-7">
        <FiHeart className="text-ruby-500" size={24} />
        <h1 className="font-display text-3xl font-semibold text-gray-900">Favoritos</h1>
        <span className="badge-ruby">{favorites.length}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[3/4] bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {favorites.map(p => (
            <ProductCard
              key={p.id}
              product={{ ...p, is_favorited: true }}
              onFavoriteToggle={load}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">💖</div>
          <h2 className="font-display text-2xl text-gray-700 mb-2">Nenhum favorito ainda</h2>
          <p className="text-gray-500 font-body mb-6">Navegue pelos produtos e clique no ❤️ para salvar</p>
          <Link to="/produtos" className="btn-ruby">Explorar Produtos</Link>
        </div>
      )}
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/api/orders')
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container py-8">
      <div className="flex items-center gap-3 mb-7">
        <FiPackage className="text-ruby-500" size={24} />
        <h1 className="font-display text-3xl font-semibold text-gray-900">Meus Pedidos</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-100 rounded w-40" />
                <div className="h-5 bg-gray-100 rounded w-24" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-32 mt-2" />
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'badge-info' };
            const isExpanded = expanded === order.id;
            return (
              <div key={order.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  className="w-full p-5 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-body font-semibold text-gray-900">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={statusInfo.color}>{statusInfo.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-body">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {' · '}
                      {order.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold text-gray-900">{formatPrice(order.total)}</span>
                    {isExpanded ? <FiChevronUp size={18} className="text-gray-400" /> : <FiChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 animate-slide-down">
                    <h4 className="font-body font-medium text-gray-700 text-sm mb-3">Itens do pedido:</h4>
                    <div className="space-y-3">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm font-body">
                          <div>
                            <span className="text-gray-900 font-medium">{item.product_name}</span>
                            {item.color_name && <span className="text-gray-500"> · {item.color_name}</span>}
                            {item.size && <span className="text-gray-500"> · {item.size}</span>}
                            <span className="text-gray-500"> · Qtd: {item.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-900 shrink-0 ml-4">{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-4 pt-3 text-sm font-body space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Frete</span>
                        <span>{parseFloat(order.shipping_cost) === 0 ? 'Grátis' : formatPrice(order.shipping_cost)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    {order.status === 'payment_pending' && order.payment_method === 'pix' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm font-body text-yellow-800">
                        ⏳ Aguardando confirmação do pagamento PIX
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="font-display text-2xl text-gray-700 mb-2">Nenhum pedido ainda</h2>
          <p className="text-gray-500 font-body mb-6">Suas compras aparecerão aqui</p>
          <Link to="/produtos" className="btn-ruby">Fazer Primeira Compra</Link>
        </div>
      )}
    </div>
  );
}
