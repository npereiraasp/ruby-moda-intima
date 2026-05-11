import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ProductCard({ product, onFavoriteToggle }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [favorited, setFavorited] = useState(product.is_favorited || false);
  const [loadingFav, setLoadingFav] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Faça login para favoritar produtos!');
      return;
    }
    setLoadingFav(true);
    try {
      if (favorited) {
        await api.delete(`/api/favorites/${product.id}`);
        setFavorited(false);
        toast.success('Removido dos favoritos');
      } else {
        await api.post(`/api/favorites/${product.id}`);
        setFavorited(true);
        toast.success('Adicionado aos favoritos! 🤍');
      }
      onFavoriteToggle?.();
    } catch {
      toast.error('Erro ao atualizar favoritos');
    } finally {
      setLoadingFav(false);
    }
  };

  const hasPromo = product.promotional_price && parseFloat(product.promotional_price) < parseFloat(product.price);
  const discount = hasPromo
    ? Math.round((1 - product.promotional_price / product.price) * 100)
    : 0;

  return (
    <div className="group card hover:shadow-lg transition-all duration-300 animate-fade-in">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-[3/4]">
        <Link to={`/produto/${product.id}`}>
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="badge bg-gold text-white text-[10px] font-semibold">⭐ Destaque</span>
          )}
          {hasPromo && (
            <span className="badge bg-ruby-600 text-white text-[10px] font-semibold">-{discount}%</span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          disabled={loadingFav}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${favorited ? 'bg-ruby-600 text-white shadow-lg' : 'bg-white/90 text-gray-500 hover:text-ruby-500 shadow'}
            hover:scale-110 active:scale-95`}
        >
          <FiHeart size={16} className={favorited ? 'fill-current' : ''} />
        </button>

        {/* Quick add (hover) */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Link
            to={`/produto/${product.id}`}
            className="flex items-center justify-center gap-2 bg-ruby-600 hover:bg-ruby-700 text-white py-3 font-body font-medium text-sm transition-colors"
          >
            <FiShoppingBag size={16} />
            Ver opções
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.category_name && (
          <p className="text-xs text-ruby-500 font-medium uppercase tracking-wide mb-1">{product.category_name}</p>
        )}
        <Link to={`/produto/${product.id}`}>
          <h3 className="font-body font-medium text-gray-900 text-sm leading-snug hover:text-ruby-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Colors */}
        {product.colors && Array.isArray(product.colors) && product.colors.filter(Boolean).length > 0 && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {product.colors.filter(Boolean).slice(0, 6).map((color, i) => (
              <span key={i} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {color}
              </span>
            ))}
            {product.colors.filter(Boolean).length > 6 && (
              <span className="text-xs text-gray-400">+{product.colors.filter(Boolean).length - 6}</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-end gap-2">
          <span className="font-display text-lg font-semibold text-gray-900">
            {formatPrice(product.promotional_price || product.price)}
          </span>
          {hasPromo && (
            <span className="text-sm text-gray-400 line-through mb-0.5">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Sizes preview */}
        {product.sizes && Array.isArray(product.sizes) && product.sizes.filter(Boolean).length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Tam: {product.sizes.filter(Boolean).slice(0, 5).join(', ')}
            {product.sizes.filter(Boolean).length > 5 && '...'}
          </p>
        )}
      </div>
    </div>
  );
}
