import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuthStore } from '../../store/authStore';
import { ProductSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  sku?: string;
  category: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

export default function WishlistPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const data = await api.wishlist.list();
      setWishlist(data);
    } catch (error) {
      toastService.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const loadingToast = toastService.loading('Removing...');

    try {
      await api.wishlist.remove(productId);
      toastService.dismiss(loadingToast);
      toastService.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to remove from wishlist');
    }
  };

  const formatCurrency = (amount: any) => {
    const num = Number(amount);
    return `Rs. ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-full h-full text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="empty-state-title">Sign in to view your wishlist</h3>
          <p className="empty-state-text">Create an account to save your favorite cards</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
            <Link to="/register" className="btn-secondary">
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink-900 mb-1">My Wishlist</h1>
      <p className="text-ink-500 mb-8">Cards you love — save them for later</p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="paper-card">
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <svg className="w-full h-full text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="empty-state-title">Your wishlist is empty</h3>
            <p className="empty-state-text">Start adding cards you love!</p>
            <Link to="/" className="btn-primary mt-6">
              Browse Cards
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="product-card group">
              <div className="relative">
                <Link to={`/product/${item.product.id}`} className="block">
                  <div className="aspect-[3/4] bg-paper-100 overflow-hidden">
                    <img
                      src={item.product.images?.[0] || '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-paper hover:bg-red-50 transition-colors"
                  title="Remove from wishlist"
                >
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-ink-500 mb-1 capitalize">{item.product.category}</p>
                <Link to={`/product/${item.product.id}`}>
                  <h3 className="font-display text-sm font-semibold text-ink-900 mb-2 line-clamp-2 hover:text-ruby-600 transition-colors">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="font-body text-base font-bold text-ruby-600 mb-3">
                  {formatCurrency(item.product.price)}
                </p>
                <div className="flex gap-2">
                  <Link
                    to={`/product/${item.product.id}`}
                    className="flex-1 text-center px-3 py-2 border border-sand-200 text-ink-700 rounded-pill text-sm font-medium hover:bg-sand-50 hover:border-sand-300 transition-all"
                  >
                    View
                  </Link>
                  <Link
                    to={`/cart?add=${item.product.id}`}
                    className="flex-1 text-center px-3 py-2 bg-ruby-500 text-white rounded-pill text-sm font-medium hover:bg-ruby-600 transition-colors"
                  >
                    Add
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
