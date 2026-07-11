import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { api } from '../../api.js';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { getImageSrc } from '../../utils/images';
import { ProductSkeleton } from '../../components/UI/LoadingSkeleton';
import { formatPrice } from '../../components/UI/Icons';
import toastService from '../../utils/toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  category: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
};

export default function WishlistPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const res = await api.wishlist.list();
      setWishlist(res.data);
    } catch {
      toastService.error('Failed to load your collection');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const loadingToast = toastService.loading('Removing...');
    try {
      await api.wishlist.remove(productId);
      toastService.dismiss(loadingToast);
      toastService.success('Removed from your collection');
      fetchWishlist();
    } catch {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to remove');
    }
  };

  const handleAddToCart = async (product: Product) => {
    await addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      image: product.images[0],
    });
    toastService.success(`${product.name} added to cart`);
  };

  const handleAddAllToCart = async () => {
    for (const item of wishlist) {
      if (item.product.stock > 0) {
        await addItem({
          productId: item.product.id,
          productName: item.product.name,
          quantity: 1,
          price: item.product.price,
          image: item.product.images[0],
        });
      }
    }
    toastService.success('All available cards added to cart');
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Heart size={24} />
            </div>
            <h3 className="empty-state-title">Sign in to view your collection</h3>
            <p className="empty-state-text">Create an account to save the cards you love</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/login" className="btn-primary">Sign In</Link>
              <Link to="/register" className="btn-outline">Register</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-1">Your Collection</h1>
            <p className="text-twinkle-ink/60 text-sm">
              {wishlist.length} card{wishlist.length !== 1 ? 's' : ''} saved with love
            </p>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={handleAddAllToCart}
              className="btn-primary text-sm gap-2"
            >
              <ShoppingCart size={16} />
              Add All to Cart
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="card">
            <div className="empty-state py-12">
              <div className="empty-state-icon">
                <Heart size={24} />
              </div>
              <h3 className="empty-state-title">Nothing saved yet</h3>
              <p className="empty-state-text">
                When you find cards that speak to you, save them here for later.
              </p>
              <Link to="/shop" className="btn-primary mt-6">
                Browse Cards
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {wishlist.map((item) => (
              <motion.div key={item.id} variants={itemVariants} className="product-card group">
                <div className="relative">
                  <Link to={`/product/${item.product.id}`} className="block">
                    <div className="aspect-[3/4] bg-twinkle-mist/20 overflow-hidden">
                      <img
                        src={getImageSrc(item.product.images?.[0]) || ''}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22 viewBox=%220 0 300 400%22%3E%3Crect fill=%22%23F5E0D3%22 width=%22300%22 height=%22400%22/%3E%3Ctext fill=%22%239BB89B%22 font-family=%22serif%22 font-size=%2218%22 x=%2250%25%22 y=%2245%25%22 text-anchor=%22middle%22%3E%F0%9F%93%8C%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-2 right-2 p-2.5 bg-white shadow-lg hover:bg-twinkle-rose/20 transition-colors rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Remove from collection"
                    aria-label="Remove from collection"
                  >
                    <Heart size={16} className="text-twinkle-rose fill-twinkle-rose" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-xs text-twinkle-ink/40 mb-1 capitalize">{item.product.category}</p>
                  <Link to={`/product/${item.product.id}`}>
                    <h3 className="font-display text-sm font-semibold text-twinkle-ink mb-2 line-clamp-2 hover:text-twinkle-rose transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="font-body text-base font-bold text-twinkle-rose mb-3">
                    {formatPrice(item.product.price)}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="flex-1 text-center px-3 py-2.5 border border-twinkle-mist text-twinkle-ink/70 rounded-full text-sm font-medium hover:bg-twinkle-mist/30 hover:border-twinkle-rose transition-all min-h-[44px] flex items-center justify-center"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleAddToCart(item.product)}
                      disabled={item.product.stock === 0}
                      className="flex-1 text-center px-3 py-2.5 bg-twinkle-ink text-white rounded-full text-sm font-medium hover:bg-twinkle-ink/90 transition-colors min-h-[44px] flex items-center justify-center disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}