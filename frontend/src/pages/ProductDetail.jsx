import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiArrowLeft, FiCheck, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/products/${id}`)
      .then(r => {
        setProduct(r.data);
        setFavorited(r.data.is_favorited || false);
        // Auto-select first color and size if available
        const colors = [...new Set(r.data.variants.map(v => v.color_name).filter(Boolean))];
        const sizes = [...new Set(r.data.variants.map(v => v.size).filter(Boolean))];
        if (colors.length > 0) setSelectedColor(colors[0]);
        if (sizes.length > 0) setSelectedSize(sizes[0]);
      })
      .catch(() => toast.error('Produto não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-container py-10 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-8 bg-gray-100 rounded" />
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container py-20 text-center">
        <p className="font-display text-2xl text-gray-500">Produto não encontrado</p>
        <Link to="/produtos" className="btn-ruby mt-4 inline-flex">Ver todos os produtos</Link>
      </div>
    );
  }

  const colors = [...new Set(product.variants.map(v => v.color_name).filter(Boolean))];
  const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))];

  // Get variant that matches selected color & size
  const selectedVariant = product.variants.find(v =>
    (!selectedColor || v.color_name === selectedColor) &&
    (!selectedSize || v.size === selectedSize)
  ) || product.variants[0] || null;

  const getColorHex = (colorName) => {
    const v = product.variants.find(v => v.color_name === colorName);
    return v?.color_hex || '#888';
  };

  const hasPromo = product.promotional_price && parseFloat(product.promotional_price) < parseFloat(product.price);
  const discount = hasPromo ? Math.round((1 - product.promotional_price / product.price) * 100) : 0;

  const handleAddToCart = () => {
    if (colors.length > 0 && !selectedColor) {
      toast.error('Selecione uma cor');
      return;
    }
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Selecione um tamanho');
      return;
    }
    addItem(product, selectedVariant, quantity);
  };

  const handleFavorite = async () => {
    if (!user) { toast.error('Faça login para favoritar!'); return; }
    try {
      if (favorited) {
        await api.delete(`/api/favorites/${product.id}`);
        setFavorited(false);
        toast.success('Removido dos favoritos');
      } else {
        await api.post(`/api/favorites/${product.id}`);
        setFavorited(true);
        toast.success('Adicionado aos favoritos! 💖');
      }
    } catch {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const images = product.images?.length > 0 ? product.images : [{ url: null, alt_text: product.name }];

  return (
    <div className="page-container py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-7 font-body">
        <Link to="/" className="hover:text-ruby-600 transition-colors">Início</Link>
        <span>/</span>
        <Link to="/produtos" className="hover:text-ruby-600 transition-colors">Produtos</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link to={`/produtos?category=${product.category_slug}`} className="hover:text-ruby-600 transition-colors">
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden mb-4">
            {images[selectedImage]?.url ? (
              <img
                src={images[selectedImage].url}
                alt={images[selectedImage].alt_text || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-ruby-500' : 'border-transparent'}`}
                >
                  {img.url ? (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category_name && (
            <span className="text-sm text-ruby-500 font-medium uppercase tracking-wide">{product.category_name}</span>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 mt-2 mb-4 leading-snug">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            <span className="font-display text-4xl font-bold text-gray-900">
              {formatPrice(product.promotional_price || product.price)}
            </span>
            {hasPromo && (
              <>
                <span className="text-xl text-gray-400 line-through mb-0.5">
                  {formatPrice(product.price)}
                </span>
                <span className="badge-ruby mb-0.5">-{discount}%</span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="font-body text-gray-600 leading-relaxed mb-6">{product.short_description}</p>
          )}

          {/* Color selection */}
          {colors.length > 0 && (
            <div className="mb-5">
              <p className="label-ruby">
                Cor: <span className="text-gray-900 font-semibold">{selectedColor || '—'}</span>
              </p>
              <div className="flex gap-2.5 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                    className={`relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === color ? 'border-ruby-600 scale-110 shadow-lg' : 'border-transparent shadow'}`}
                    style={{ backgroundColor: getColorHex(color) }}
                  >
                    {selectedColor === color && (
                      <FiCheck className="absolute inset-0 m-auto text-white drop-shadow" size={16} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selection */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <p className="label-ruby">
                Tamanho: <span className="text-gray-900 font-semibold">{selectedSize || '—'}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-xl border-2 font-body font-medium text-sm transition-all ${
                      selectedSize === size
                        ? 'border-ruby-600 bg-ruby-50 text-ruby-700'
                        : 'border-gray-200 text-gray-700 hover:border-ruby-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="label-ruby mb-0">Quantidade:</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FiMinus size={16} />
              </button>
              <span className="px-5 py-2.5 font-body font-medium text-gray-900 min-w-[50px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FiPlus size={16} />
              </button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 mb-8">
            <button onClick={handleAddToCart} className="btn-ruby flex-1 flex items-center justify-center gap-2 py-4">
              <FiShoppingBag size={18} />
              Adicionar ao Carrinho
            </button>
            <button
              onClick={handleFavorite}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                favorited ? 'bg-ruby-50 border-ruby-500 text-ruby-600' : 'border-gray-200 text-gray-500 hover:border-ruby-300'
              }`}
            >
              <FiHeart size={20} className={favorited ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Shipping info */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3.5 flex items-center gap-3 mb-6 text-sm">
            <span className="text-green-600 font-medium">🚚 Frete grátis</span>
            <span className="text-green-700">em compras acima de R$200</span>
          </div>

          {/* Full description */}
          {product.description && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-body font-semibold text-gray-900 mb-3">Descrição</h3>
              <p className="font-body text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
