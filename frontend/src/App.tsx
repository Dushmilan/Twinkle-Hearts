import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout/Layout';
import HomePage from './pages/Home/HomePage';
import ProductDetailPage from './pages/ProductDetail/ProductDetailPage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccess/OrderSuccessPage';
import { useCartStore } from './store/cartStore';

function App() {
  const syncCart = useCartStore((state) => state.syncWithBackend);

  // Sync cart on app mount
  useEffect(() => {
    syncCart();
  }, [syncCart]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
