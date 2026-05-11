import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiShoppingBag, FiTag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <div className="text-7xl mb-6">🛍️</div>
        <h2 className="font-display text-3xl font-semibold text-gray-800 mb-3">Seu carrinho está vazio</h2>
        <p className="text-gray-500 font-body mb-8">Que tal descobrir nossas peças incríveis?</p>
        <Link to="/produtos" className="btn-ruby inline-flex items-center gap-2">
          <FiShoppingBag size={18} /> Explorar Produtos
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="page-container py-8">
      <div className="flex items-center gap-3 mb-7">
        <Link to="/produtos" className="text-gray-500 hover:text-ruby-600 transition-colors">
          <FiArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-3xl font-semibold text-gray-900">Carrinho</h1>
        <span className="badge-ruby">{items.length} ite{items.length !== 1 ? 'ns' : 'm'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.key} className="card p-5 flex gap-4 animate-fade-in">
              {item.primary_image ? (
                <img
                  src={item.primary_image}
                  alt={item.product_name}
                  className="w-24 h-28 object-cover rounded-xl shrink-0"
                />
              ) : (
                <div className="w-24 h-28 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center text-gray-300 text-3xl">
                  👗
                </div>
              )}

              <div className="flex-1 min-w-0">
                <Link to={`/produto/${item.product_id}`} className="font-body font-medium text-gray-900 hover:text-ruby-600 transition-colors line-clamp-2">
                  {item.product_name}
                </Link>

                <div className="flex flex-wrap gap-2 mt-2">
                  {item.color_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                      {item.color_hex && (
                        <span className="w-3 h-3 rounded-full border border-white shadow-sm inline-block" style={{ backgroundColor: item.color_hex }} />
                      )}
                      {item.color_name}
                    </div>
                  )}
                  {item.size && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                      Tam: {item.size}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-body font-semibold text-gray-900 text-lg mb-5">Resumo do Pedido</h2>

            <div className="space-y-3 text-sm font-body">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'Grátis 🎉' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                  Faltam {formatPrice(200 - subtotal)} para frete grátis
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900 text-base">
                <span>Total</span>
                <span className="font-display text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-ruby w-full mt-6 py-4 text-base"
            >
              {user ? 'Finalizar Compra' : 'Entrar e Finalizar'}
            </button>

            <div className="flex items-center gap-2 mt-4 justify-center text-xs text-gray-500">
              <FiTag size={12} />
              <span>PIX ou Cartão de Crédito</span>
            </div>

            <Link to="/produtos" className="block text-center text-sm text-ruby-600 hover:text-ruby-700 font-medium mt-4 transition-colors">
              ← Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
