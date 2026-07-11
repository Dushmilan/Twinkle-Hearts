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
    <div className="product-card group">
      <Link to={`/product/${product.id}`} className="block">
        <div className="product-card-image relative">
          {!imgError && product.images[0] ? (
            <img
              src={getImageSrc(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-twinkle-mist/20">
              <div className="w-12 h-12 rounded-2xl bg-twinkle-mist/30 flex items-center justify-center mb-2">
                <Heart size={22} className="text-twinkle-ink/40" />
              </div>
              <span className="text-xs font-medium text-twinkle-ink/40">No preview</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="badge badge-plum">{categoryLabel}</span>
          </div>
        </div>
      </Link>

      <div className="product-card-body">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-twinkle-ink line-clamp-2 hover:text-twinkle-blush transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-base font-semibold text-twinkle-blush tracking-tight">
            {formatPrice(product.price)}
          </span>

          {product.stock > 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(product);
              }}
              className="p-2 rounded-xl bg-twinkle-mist/20 text-twinkle-ink/50 hover:bg-twinkle-blush hover:text-white transition-colors duration-200"
              aria-label="Add to cart"
            >
              <ShoppingCart size={15} />
            </button>
          ) : (
            <span className="text-xs text-twinkle-ink/40 font-medium">Sold out</span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 3 && (
          <p className="text-xs text-twinkle-blush mt-2.5 font-medium">
            Only {product.stock} remaining
          </p>
        )}
      </div>
    </div>
  );
}
