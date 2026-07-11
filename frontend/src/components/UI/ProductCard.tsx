import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageSrc } from '../../utils/images';
import { formatPrice, CATEGORY_MAP } from './Icons';
import type { ProductListItem } from '@twinkle-hearts/shared';
import { CardContainer, CardBody, CardItem } from '../UI/3d-card';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api';

interface ProductCardProps {
  product: ProductListItem;
  onAddToCart?: (product: ProductListItem) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const categoryLabel = CATEGORY_MAP[product.category?.toLowerCase() ?? ''] || product.category || 'General';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1200);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await api.wishlist.remove(product.id);
        setIsWishlisted(false);
      } else {
        await api.wishlist.add(product.id);
        setIsWishlisted(true);
      }
    } catch {
      // silently fail
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <CardContainer containerClassName="py-0" className="w-full h-full">
      <CardBody className="group relative bg-white rounded-[20px] border border-twinkle-mist shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(166,56,30,0.12),0_4px_8px_rgba(0,0,0,0.04)] w-full h-full flex flex-col">
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-[20px]">
            {!imgError && product.images[0] ? (
              <CardItem translateZ={60} className="w-full h-full">
                <img
                  src={getImageSrc(product.images[0])}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              </CardItem>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-twinkle-canvas to-white">
                <CardItem translateZ={30} className="w-14 h-14 rounded-2xl bg-twinkle-rose/10 flex items-center justify-center mb-3">
                  <Heart size={24} className="text-twinkle-rose/60" />
                </CardItem>
                <CardItem translateZ={20}>
                  <span className="text-xs font-medium text-twinkle-ink/40 tracking-wide">No preview</span>
                </CardItem>
              </div>
            )}
            <CardItem translateZ={40} className="absolute top-3 left-3 z-10">
              <span className="badge badge-plum">{categoryLabel}</span>
            </CardItem>

            {/* Wishlist Heart — top right */}
            {isAuthenticated && (
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 active:scale-90"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={16}
                  className={`transition-colors duration-200 ${isWishlisted ? 'text-twinkle-rose fill-twinkle-rose' : 'text-twinkle-ink/40'}`}
                />
              </button>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        <div className="p-5 flex-1 flex flex-col justify-between">
          <CardItem translateZ={30}>
            <Link to={`/product/${product.id}`}>
              <h3 className="font-display text-sm font-semibold text-twinkle-ink line-clamp-2 group-hover:text-twinkle-rose transition-colors duration-200 leading-snug">
                {product.name}
              </h3>
            </Link>
          </CardItem>

          <CardItem translateZ={40}>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-twinkle-mist/40">
              <span className="font-mono text-lg font-bold text-twinkle-rose tracking-tight">
                {formatPrice(product.price)}
              </span>

              {product.stock > 0 ? (
                <div className="relative">
                  <button
                    onClick={handleAddToCart}
                    className="w-11 h-11 rounded-full bg-twinkle-canvas border border-twinkle-mist/60 flex items-center justify-center text-twinkle-ink/50 hover:bg-twinkle-rose hover:text-white hover:border-twinkle-rose transition-all duration-200 active:scale-95 min-w-[44px] min-h-[44px]"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart size={16} />
                  </button>
                  <AnimatePresence>
                    {addedToCart && (
                      <motion.span
                        key="heart-pop"
                        initial={{ scale: 0, opacity: 0, y: 0 }}
                        animate={{ scale: 1.4, opacity: 1, y: -8 }}
                        exit={{ scale: 2, opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center text-twinkle-rose pointer-events-none"
                      >
                        <Heart size={18} fill="currentColor" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <span className="text-xs text-twinkle-ink/40 font-medium">Sold out</span>
              )}
            </div>
          </CardItem>

          {product.stock > 0 && product.stock <= 3 && (
            <CardItem translateZ={20}>
              <p className="text-xs text-twinkle-rose mt-3 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-twinkle-rose animate-pulse" />
                Only {product.stock} remaining
              </p>
            </CardItem>
          )}
        </div>
      </CardBody>
    </CardContainer>
  );
}