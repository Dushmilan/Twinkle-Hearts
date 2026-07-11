import { Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/i18n';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import { MotionConfig } from 'framer-motion';
import HomePage from './pages/Home/HomePage';
import ShopPage from './pages/Shop/ShopPage';
import ProductDetailPage from './pages/ProductDetail/ProductDetailPage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccess/OrderSuccessPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Profile/ProfilePage';
import OrderHistoryPage from './pages/Orders/OrderHistoryPage';
import AddressManagementPage from './pages/Address/AddressManagementPage';
import WishlistPage from './pages/Wishlist/WishlistPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
const AdminDashboardPage = lazy(() => import('./pages/Admin/DashboardPage'));
const AdminOrdersPage = lazy(() => import('./pages/Admin/OrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/Admin/OrderDetailPage'));
const AdminProductsPage = lazy(() => import('./pages/Admin/ProductsPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/UsersPage'));
import { useCartStore } from './store/cartStore';

function AppRoutes() {
  const syncCart = useCartStore((state) => state.syncCart);

  // Sync cart on app mount
  useEffect(() => {
    syncCart();
  }, [syncCart]);

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addresses"
          element={
            <ProtectedRoute>
              <AddressManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-blush" /></div>}>
                <AdminDashboardPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-blush" /></div>}>
                <AdminOrdersPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-blush" /></div>}>
                <AdminOrderDetailPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-blush" /></div>}>
                <AdminProductsPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-blush" /></div>}>
                <AdminUsersPage />
              </Suspense>
            </AdminRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-twinkle-ink focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-twinkle-blush"
          >
            Skip to main content
          </a>
          <MotionConfig reducedMotion="user">
            <AppRoutes />
          </MotionConfig>
          <Toaster
            position="top-right"
            containerClassName="aria-live-polite"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#8B2E85',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
