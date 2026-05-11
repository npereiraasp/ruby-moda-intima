import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeart } from 'react-icons/fi';
import ProductCard from '../components/ui/ProductCard';
import api from '../utils/api';

function formatPrice(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/products?featured=true&limit=8'),
      api.get('/api/products/categories'),
      api.get('/api/settings')
    ]).then(([prodRes, catRes, settRes]) => {
      setFeatured(prodRes.data.products);
      setCategories(catRes.data);
      setSettings(settRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ruby-900 via-ruby-700 to-blush-400 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blush-300 rounded-full blur-3xl" />
        </div>

        <div className="page-container relative py-24 md:py-36">
          <div className="max-w-2xl animate-slide-up">
            <span className="inline-block text-xs font-body font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
              🌹 Moda Íntima Plus Size
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Beleza sem<br />
              <span className="italic text-blush-200">limites</span>
            </h1>
            <p className="font-body text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
              Lingerie e moda íntima desenvolvida especialmente para o corpo plus size.
              Conforto, elegância e sensualidade do 44 ao 60.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/produtos" className="bg-white text-ruby-700 hover:bg-blush-50 font-body font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg active:scale-98 flex items-center gap-2">
                Ver Coleção <FiArrowRight size={18} />
              </Link>
              <Link to="/produtos?category=conjuntos" className="border-2 border-white/50 hover:border-white hover:bg-white/10 font-body font-semibold px-8 py-4 rounded-xl transition-all">
                Conjuntos
              </Link>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="#FDF8F5" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FiTruck, title: 'Frete Grátis', desc: 'Acima de R$200' },
            { icon: FiShield, title: 'Compra Segura', desc: 'Pagamento protegido' },
            { icon: FiRefreshCw, title: 'Troca Fácil', desc: 'Até 30 dias' },
            { icon: FiHeart, title: 'Plus Size', desc: 'Do 44 ao 60' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-gray-100 hover:border-ruby-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-ruby-50 rounded-full flex items-center justify-center mb-3">
                <item.icon className="text-ruby-600" size={20} />
              </div>
              <p className="font-body font-semibold text-gray-900 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="page-container py-10">
        <div className="flex items-end justify-between mb-8">
          <h2 className="section-title">Categorias</h2>
          <Link to="/produtos" className="text-ruby-600 hover:text-ruby-700 font-body font-medium text-sm flex items-center gap-1">
            Ver todas <FiArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map(cat => (
            <Link
              key={cat.id}
              to={`/produtos?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 hover:border-ruby-200 hover:shadow-md transition-all text-center"
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-14 h-14 object-cover rounded-full" />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-ruby-100 to-blush-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👙</span>
                </div>
              )}
              <span className="font-body font-medium text-gray-800 text-sm group-hover:text-ruby-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="page-container py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Destaques</h2>
            <p className="text-gray-500 font-body mt-1">As peças mais amadas da temporada</p>
          </div>
          <Link to="/produtos?featured=true" className="text-ruby-600 hover:text-ruby-700 font-body font-medium text-sm flex items-center gap-1">
            Ver mais <FiArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
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
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="font-display text-2xl mb-2">Nenhum produto em destaque</p>
            <p className="text-sm">Em breve novidades! 🌹</p>
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="page-container py-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ruby-800 to-ruby-600 text-white p-10 md:p-16">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-2xl" />
          </div>
          <div className="relative max-w-lg">
            <span className="text-xs font-body font-semibold tracking-widest uppercase text-ruby-200 mb-3 block">
              Nova Coleção
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Toda mulher merece se sentir linda
            </h2>
            <p className="font-body text-white/75 mb-7 leading-relaxed">
              Peças que abraçam cada curva com amor e elegância. Tecidos premium, modelagem exclusiva.
            </p>
            <Link
              to="/produtos"
              className="inline-flex items-center gap-2 bg-white text-ruby-700 font-body font-semibold px-7 py-3.5 rounded-xl hover:bg-blush-50 transition-all hover:shadow-lg"
            >
              Explorar Coleção <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
