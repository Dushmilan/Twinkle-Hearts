import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProductSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  sku: string;
  category: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

export default function WishlistPage() {
  const { tokens, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      fetchWishlist();
    }
  }, [isAuthenticated, tokens?.accessToken]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/wishlist', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data = await response.json();
      setWishlist(data.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toastService.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const loadingToast = toastService.loading('Removing from wishlist...');
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      toastService.dismiss(loadingToast);
      toastService.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to remove from wishlist');
      console.error('Error removing from wishlist:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-pink-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Sign in to view wishlist</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create an account to save your favorite products
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 border border-pink-600 text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <svg
            className="mx-auto h-12 w-12 text-pink-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start adding products you love!
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
              <div className="relative">
                <img
                  src={item.product.images?.[0] || '/placeholder.jpg'}
                  alt={item.product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                  title="Remove from wishlist"
                >
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-1">{item.product.category}</p>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.product.name}
                </h3>
                <p className="text-lg font-bold text-pink-600">
                  {formatCurrency(item.product.price)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/product/${item.product.id}`}
                    className="flex-1 text-center px-4 py-2 border border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition font-medium"
                  >
                    View
                  </Link>
                  <Link
                    to={`/cart?add=${item.product.id}`}
                    className="flex-1 text-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium"
                  >
                    Add to Cart
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {wishlist.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            to="/cart"
            className="inline-flex items-center px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
          >
            Move All to Cart
          </Link>
        </div>
      )}
    </div>
  );
}
