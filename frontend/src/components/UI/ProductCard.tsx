import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { getImageSrc } from '../../utils/images';
import { formatPrice, CATEGORY_MAP } from './Icons';
import type { ProductListItem } from '@twinkle-hearts/shared';

interface ProductCardProps {
  product: ProductListItem;
  onAddToCart?: (product: ProductListItem) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const categoryLabel = CATEGORY_MAP[product.category?.toLowerCase() ?? ''] || product.category || 'General';

  return (
    <div className="group relative bg-white rounded-[20px] border border-twinkle-mist shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(157,62,10,0.12),0_4px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-[20px]">
          {!imgError && product.images[0] ? (
            <img
              src={getImageSrc(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-twinkle-canvas to-white">
              <div className="w-14 h-14 rounded-2xl bg-twinkle-rose/10 flex items-center justify-center mb-3">
                <Heart size={24} className="text-twinkle-rose/60" />
              </div>
              <span className="text-xs font-medium text-twinkle-ink/40 tracking-wide">No preview</span>
            </div>
          )}
          <div className="absolute top-3 left-3 z-10">
            <span className="badge badge-plum">{categoryLabel}</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      <div className="p-5">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-twinkle-ink line-clamp-2 group-hover:text-twinkle-rose transition-colors duration-200 leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-twinkle-mist/40">
          <span className="font-mono text-lg font-bold text-twinkle-rose tracking-tight">
            {formatPrice(product.price)}
          </span>

          {product.stock > 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(product);
              }}
              className="w-10 h-10 rounded-full bg-twinkle-canvas border border-twinkle-mist/60 flex items-center justify-center text-twinkle-ink/50 hover:bg-twinkle-rose hover:text-white hover:border-twinkle-rose transition-all duration-200 active:scale-95"
              aria-label="Add to cart"
            >
              <ShoppingCart size={16} />
            </button>
          ) : (
            <span className="text-xs text-twinkle-ink/40 font-medium">Sold out</span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 3 && (
          <p className="text-xs text-twinkle-rose mt-3 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-twinkle-rose animate-pulse" />
            Only {product.stock} remaining
          </p>
        )}
      </div>
    </div>
  );
}
