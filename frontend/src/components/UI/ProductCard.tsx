import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import gsap from 'gsap';
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
  const heartRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const categoryLabel = CATEGORY_MAP[product.category?.toLowerCase() ?? ''] || product.category || 'General';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1200);
  };

  useEffect(() => {
    if (!addedToCart || !heartRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(heartRef.current, { scale: 0, y: 0 }, { scale: 1.4, y: -8, duration: 0.3, ease: 'back.out(2)' })
      .to(heartRef.current, { scale: 2, opacity: 0, y: -24, duration: 0.4, ease: 'power2.in' });
    return () => { tl.kill(); };
  }, [addedToCart]);

  useEffect(() => {
    if (!cardRef.current) return;
    const handleMouseEnter = () => {
      gsap.to(cardRef.current, { boxShadow: '0 12px 32px rgba(166,56,30,0.12), 0 4px 8px rgba(0,0,0,0.04)', borderColor: 'rgba(166,82,58,0.3)', duration: 0.3, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      gsap.to(cardRef.current, { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)', borderColor: '#dfd3c8', duration: 0.3, ease: 'power2.out' });
    };
    cardRef.current.addEventListener('mouseenter', handleMouseEnter);
    cardRef.current.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      cardRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      cardRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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
      <CardBody className="group w-full h-full flex flex-col">
        <div
          ref={cardRef}
          className="relative bg-white rounded-[20px] border border-twinkle-mist shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] w-full h-full flex flex-col"
        >
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

              {product.stock > 0 ? (
                <CardItem translateZ={50} className="absolute bottom-3 right-3 z-10">
                  <div className="relative">
                    <button
                      onClick={handleAddToCart}
                      className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-twinkle-mist/60 flex items-center justify-center text-twinkle-ink/60 shadow-sm hover:bg-twinkle-rose hover:text-white hover:border-twinkle-rose transition-all duration-200 active:scale-90 min-w-[44px] min-h-[44px]"
                      aria-label="Add to cart"
                    >
                      <ShoppingCart size={16} />
                    </button>
                    <div
                      ref={heartRef}
                      className="absolute inset-0 flex items-center justify-center text-twinkle-rose pointer-events-none opacity-0"
                    >
                      <Heart size={18} fill="currentColor" />
                    </div>
                  </div>
                </CardItem>
              ) : null}
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
                {product.stock <= 0 && (
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
        </div>
      </CardBody>
    </CardContainer>
  );
}