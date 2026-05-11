import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiGrid, FiList, FiX, FiChevronDown } from 'react-icons/fi';
import ProductCard from '../components/ui/ProductCard';
import api from '../utils/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const page = parseInt(searchParams.get('page') || '1');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (featured) params.set('featured', featured);
      params.set('sort', sort);
      params.set('page', page);
      params.set('limit', '12');

      const res = await api.get(`/api/products?${params}`);
      setProducts(res.data.products);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, featured, sort, page]);

  useEffect(() => {
    api.get('/api/products/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadProducts]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = category || search || featured;

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-gray-900">
          {category
            ? categories.find(c => c.slug === category)?.name || 'Categoria'
            : search
            ? `Busca: "${search}"`
            : featured
            ? 'Produtos em Destaque'
            : 'Todos os Produtos'}
        </h1>
        <p className="text-gray-500 font-body mt-1">{total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-body font-semibold text-gray-900">Filtros</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-ruby-600 hover:text-ruby-700 font-medium flex items-center gap-1">
                  <FiX size={12} /> Limpar
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categoria</h4>
              <div className="space-y-1">
                <button
                  onClick={() => setFilter('category', '')}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${!category ? 'bg-ruby-50 text-ruby-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilter('category', cat.slug)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${category === cat.slug ? 'bg-ruby-50 text-ruby-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ordenar</h4>
              <select
                value={sort}
                onChange={e => setFilter('sort', e.target.value)}
                className="input-ruby text-sm"
              >
                <option value="created_at">Mais recentes</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {/* Mobile filters bar */}
          <div className="flex items-center gap-3 mb-5 lg:hidden">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 btn-outline text-sm py-2"
            >
              <FiFilter size={16} /> Filtros
              {hasFilters && <span className="badge-ruby">!</span>}
            </button>
            <select
              value={sort}
              onChange={e => setFilter('sort', e.target.value)}
              className="input-ruby text-sm flex-1"
            >
              <option value="created_at">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>

          {/* Mobile filter panel */}
          {filterOpen && (
            <div className="lg:hidden card p-5 mb-5 animate-slide-down">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categoria</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setFilter('category', ''); setFilterOpen(false); }}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all ${!category ? 'bg-ruby-600 text-white border-ruby-600' : 'border-gray-200 text-gray-700 hover:border-ruby-300'}`}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setFilter('category', cat.slug); setFilterOpen(false); }}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${category === cat.slug ? 'bg-ruby-600 text-white border-ruby-600' : 'border-gray-200 text-gray-700 hover:border-ruby-300'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {category && (
                <span className="badge badge-ruby">
                  {categories.find(c => c.slug === category)?.name}
                  <button onClick={() => setFilter('category', '')}><FiX size={12} /></button>
                </span>
              )}
              {search && (
                <span className="badge badge-ruby">
                  Busca: {search}
                  <button onClick={() => setFilter('search', '')}><FiX size={12} /></button>
                </span>
              )}
              {featured && (
                <span className="badge badge-ruby">
                  Em destaque
                  <button onClick={() => setFilter('featured', '')}><FiX size={12} /></button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[3/4] bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} onFavoriteToggle={loadProducts} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilter('page', String(i + 1))}
                      className={`w-10 h-10 rounded-xl font-body font-medium text-sm transition-all ${
                        page === i + 1
                          ? 'bg-ruby-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-ruby-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-2xl text-gray-700 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 font-body mb-6">Tente outros filtros ou termos de busca</p>
              <button onClick={clearFilters} className="btn-ruby">Limpar filtros</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
