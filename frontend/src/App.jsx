import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import FavoritesOrders from './pages/FavoritesOrders';
import Profile from './pages/Profile';
import Admin from './pages/admin/Admin';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ruby-600"></div></div>;
  return user ? children : <Navigate to="/entrar" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ruby-600"></div></div>;
  return user?.is_admin ? children : <Navigate to="/" replace />;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Admin routes - sem navbar/footer padrão */}
      <Route path="/admin/*" element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
      } />

      {/* Public routes */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/produtos" element={<PublicLayout><Products /></PublicLayout>} />
      <Route path="/produtos/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
      <Route path="/carrinho" element={<PublicLayout><Cart /></PublicLayout>} />
      <Route path="/entrar" element={<PublicLayout><Auth /></PublicLayout>} />

      {/* Protected routes */}
      <Route path="/checkout" element={
        <PrivateRoute>
          <PublicLayout><Checkout /></PublicLayout>
        </PrivateRoute>
      } />
      <Route path="/favoritos" element={
        <PrivateRoute>
          <PublicLayout><FavoritesOrders /></PublicLayout>
        </PrivateRoute>
      } />
      <Route path="/pedidos" element={
        <PrivateRoute>
          <PublicLayout><FavoritesOrders defaultTab="orders" /></PublicLayout>
        </PrivateRoute>
      } />
      <Route path="/perfil" element={
        <PrivateRoute>
          <PublicLayout><Profile /></PublicLayout>
        </PrivateRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
