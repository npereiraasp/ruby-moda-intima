import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  FiShoppingBag, FiHeart, FiUser, FiMenu, FiX,
  FiSearch, FiLogOut, FiSettings, FiPackage, FiChevronDown
} from 'react-icons/fi';
import { RiGemLine } from 'react-icons/ri';
import api from '../../utils/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState({ company_name: 'Ruby - Moda Íntima' });

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data)).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const categories = [
    { label: 'Sutiãs', slug: 'sutias' },
    { label: 'Calcinhas', slug: 'calcinhas' },
    { label: 'Conjuntos', slug: 'conjuntos' },
    { label: 'Camisolas', slug: 'camisolas' },
    { label: 'Pijamas', slug: 'pijamas' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      }`}>
        {/* Top bar */}
        <div className="bg-ruby-600 text-white text-xs py-1.5 text-center font-body">
          🌹 Frete grátis nas compras acima de R$200 • Plus Size do 44 ao 60
        </div>

        <div className="page-container">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-ruby-600 rounded-full flex items-center justify-center">
                <RiGemLine className="text-white text-lg" />
              </div>
              <div>
                <span className="font-display text-xl font-semibold text-ruby-700 leading-none block">
                  {settings.company_name?.split(' - ')[0] || 'Ruby'}
                </span>
                <span className="text-xs text-gray-500 font-body leading-none hidden sm:block">
                  Moda Íntima
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {categories.map(cat => (
                <NavLink
                  key={cat.slug}
                  to={`/produtos?category=${cat.slug}`}
                  className="font-body text-sm text-gray-700 hover:text-ruby-600 px-3 py-2 rounded-lg hover:bg-ruby-50 transition-all"
                >
                  {cat.label}
                </NavLink>
              ))}
              <NavLink to="/produtos" className="font-body text-sm text-gray-700 hover:text-ruby-600 px-3 py-2 rounded-lg hover:bg-ruby-50 transition-all">
                Todos
              </NavLink>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600 hover:text-ruby-600 hover:bg-ruby-50 rounded-lg transition-all"
              >
                <FiSearch size={20} />
              </button>

              {/* Favorites */}
              {user && (
                <Link to="/favoritos" className="p-2 text-gray-600 hover:text-ruby-600 hover:bg-ruby-50 rounded-lg transition-all">
                  <FiHeart size={20} />
                </Link>
              )}

              {/* Cart */}
              <Link to="/carrinho" className="p-2 text-gray-600 hover:text-ruby-600 hover:bg-ruby-50 rounded-lg transition-all relative">
                <FiShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ruby-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 text-gray-600 hover:text-ruby-600 hover:bg-ruby-50 rounded-lg transition-all"
                  >
                    <FiUser size={20} />
                    <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                    <FiChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-slide-down">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="font-medium text-sm text-gray-900">{user.name.split(' ')[0]}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-ruby-50 hover:text-ruby-600 transition-all">
                        <FiUser size={16} /> Meu Perfil
                      </Link>
                      <Link to="/meus-pedidos" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-ruby-50 hover:text-ruby-600 transition-all">
                        <FiPackage size={16} /> Meus Pedidos
                      </Link>
                      <Link to="/favoritos" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-ruby-50 hover:text-ruby-600 transition-all">
                        <FiHeart size={16} /> Favoritos
                      </Link>
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ruby-600 font-medium hover:bg-ruby-50 transition-all">
                            <FiSettings size={16} /> Painel Admin
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 mt-1">
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all">
                          <FiLogOut size={16} /> Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 btn-ruby text-sm py-2 px-4">
                  <FiUser size={16} />
                  <span className="hidden sm:block">Entrar</span>
                </Link>
              )}

              {/* Mobile menu btn */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-ruby-600 rounded-lg"
              >
                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 animate-slide-down">
            <div className="page-container py-3 flex flex-col gap-1">
              {categories.map(cat => (
                <NavLink
                  key={cat.slug}
                  to={`/produtos?category=${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="font-body text-sm text-gray-700 hover:text-ruby-600 px-3 py-2.5 rounded-lg hover:bg-ruby-50"
                >
                  {cat.label}
                </NavLink>
              ))}
              <NavLink to="/produtos" onClick={() => setMenuOpen(false)} className="font-body text-sm text-gray-700 hover:text-ruby-600 px-3 py-2.5 rounded-lg hover:bg-ruby-50">
                Todos os Produtos
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-ruby flex-1"
              />
              <button type="submit" className="btn-ruby px-5">
                <FiSearch size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-[88px]" />

      {/* Close dropdowns on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
