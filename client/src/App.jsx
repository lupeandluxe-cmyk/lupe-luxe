import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import BottomNav from './components/BottomNav';
import AdminLayout from './components/AdminLayout';
import useStandalone from './hooks/useStandalone';
import { internalFetch } from './hooks/useInternalAuth';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirm from './pages/OrderConfirm';
import Login from './pages/Login';
import OtpLogin from './pages/OtpLogin';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import EditProduct from './pages/admin/EditProduct';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminCategories from './pages/admin/Categories';
import AdminCoupons from './pages/admin/Coupons';
import AdminHomepage from './pages/admin/Homepage';
import AdminMedia from './pages/admin/Media';
import AdminSettings from './pages/admin/Settings';
import AdminPaymentSettings from './pages/admin/PaymentSettings';
import AdminPages from './pages/admin/Pages';
import AdminReports from './pages/admin/Reports';
import AdminLiveChat from './pages/admin/LiveChat';
import AdminManagement from './pages/admin/AdminManagement';
import InternalLogin from './pages/internal/InternalLogin';
import InternalDashboard from './pages/internal/InternalDashboard';
import InternalOrders from './pages/internal/InternalOrders';
import InternalNotifications from './pages/internal/InternalNotifications';
import InternalChat from './pages/internal/InternalChat';
import InternalTasks from './pages/internal/InternalTasks';
import InternalDepartments from './pages/internal/InternalDepartments';
import InternalEmployees from './pages/internal/InternalEmployees';
import InternalActivity from './pages/internal/InternalActivity';
import InternalSettings from './pages/internal/InternalSettings';
import InternalReports from './pages/internal/InternalReports';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.isAdmin ? children : <Navigate to="/" />;
}

function InternalRoute({ children }) {
  const [authorized, setAuthorized] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('internal_token');
    if (!token) { setAuthorized(false); return; }
    let cancelled = false;
    internalFetch('/auth/profile')
      .then(data => { if (!cancelled) setAuthorized(!!data.employee); })
      .catch(() => { if (!cancelled) setAuthorized(false); });
    return () => { cancelled = true; };
  }, []);
  if (authorized === null) return null;
  return authorized ? children : <Navigate to="/internal/login" replace />;
}

const AdminPage = ({ Component }) => <AdminLayout><Component /></AdminLayout>;
const InternalPage = ({ Component }) => <AdminLayout><Component /></AdminLayout>;

function AppRoutes() {
  const isApp = useStandalone();

  return (
    <div className={`app ${isApp ? 'app-mode' : 'web-mode'}`}>
      {!isApp && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp-login" element={<OtpLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/order/:id" element={<PrivateRoute><OrderConfirm /></PrivateRoute>} />
          <Route path="/page/:slug" element={<div>Page</div>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminPage Component={AdminDashboard} /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminPage Component={AdminProducts} /></AdminRoute>} />
          <Route path="/admin/products/new" element={<AdminRoute><AdminPage Component={EditProduct} /></AdminRoute>} />
          <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminPage Component={EditProduct} /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminPage Component={AdminOrders} /></AdminRoute>} />
          <Route path="/admin/customers" element={<AdminRoute><AdminPage Component={AdminCustomers} /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminPage Component={AdminCategories} /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminPage Component={AdminCoupons} /></AdminRoute>} />
          <Route path="/admin/homepage" element={<AdminRoute><AdminPage Component={AdminHomepage} /></AdminRoute>} />
          <Route path="/admin/media" element={<AdminRoute><AdminPage Component={AdminMedia} /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminPage Component={AdminSettings} /></AdminRoute>} />
          <Route path="/admin/payment-settings" element={<AdminRoute><AdminPage Component={AdminPaymentSettings} /></AdminRoute>} />
          <Route path="/admin/pages" element={<AdminRoute><AdminPage Component={AdminPages} /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminPage Component={AdminReports} /></AdminRoute>} />
          <Route path="/admin/live-chat" element={<AdminRoute><AdminPage Component={AdminLiveChat} /></AdminRoute>} />
          <Route path="/admin/admins" element={<AdminRoute><AdminPage Component={AdminManagement} /></AdminRoute>} />

          {/* Internal Portal routes — inside AdminLayout, protected by InternalRoute */}
          <Route path="/internal/login" element={<InternalLogin />} />
          <Route path="/admin/internal/dashboard" element={<InternalRoute><InternalPage Component={InternalDashboard} /></InternalRoute>} />
          <Route path="/admin/internal/orders" element={<InternalRoute><InternalPage Component={InternalOrders} /></InternalRoute>} />
          <Route path="/admin/internal/notifications" element={<InternalRoute><InternalPage Component={InternalNotifications} /></InternalRoute>} />
          <Route path="/admin/internal/chat" element={<InternalRoute><InternalPage Component={InternalChat} /></InternalRoute>} />
          <Route path="/admin/internal/tasks" element={<InternalRoute><InternalPage Component={InternalTasks} /></InternalRoute>} />
          <Route path="/admin/internal/departments" element={<InternalRoute><InternalPage Component={InternalDepartments} /></InternalRoute>} />
          <Route path="/admin/internal/employees" element={<InternalRoute><InternalPage Component={InternalEmployees} /></InternalRoute>} />
          <Route path="/admin/internal/activity" element={<InternalRoute><InternalPage Component={InternalActivity} /></InternalRoute>} />
          <Route path="/admin/internal/settings" element={<InternalRoute><InternalPage Component={InternalSettings} /></InternalRoute>} />
          <Route path="/admin/internal/reports" element={<InternalRoute><InternalPage Component={InternalReports} /></InternalRoute>} />

          {/* Redirect /admin/internal to dashboard */}
          <Route path="/admin/internal" element={<Navigate to="/admin/internal/dashboard" replace />} />
          {/* Redirect old /internal routes for backwards compat */}
          <Route path="/internal" element={<Navigate to="/admin/internal/dashboard" replace />} />
          <Route path="/internal/dashboard" element={<Navigate to="/admin/internal/dashboard" replace />} />
          <Route path="/internal/orders" element={<Navigate to="/admin/internal/orders" replace />} />
          <Route path="/internal/chat" element={<Navigate to="/admin/internal/chat" replace />} />
          <Route path="/internal/tasks" element={<Navigate to="/admin/internal/tasks" replace />} />
          <Route path="/internal/employees" element={<Navigate to="/admin/internal/employees" replace />} />
          <Route path="/internal/activity" element={<Navigate to="/admin/internal/activity" replace />} />
          <Route path="/internal/settings" element={<Navigate to="/admin/internal/settings" replace />} />
        </Routes>
      </main>
      {!isApp && <Footer />}
      {isApp && <BottomNav />}
      <ChatBot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
