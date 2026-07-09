'use client';

import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from '@phosphor-icons/react';
import { useCartStore } from '../../store/cartStore';
import { CATEGORY_MAP, CATEGORY_BADGE, formatPrice } from './Icons';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category?: string;
  images: string[];
}

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

/**
 * Shared product card with hover effects and add-to-cart action.
 * Isolated as a client component for interactive state.
 */
const ProductCard = memo(function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const categoryKey = product.category?.toLowerCase() || '';
  const badgeClass = CATEGORY_BADGE[categoryKey] || 'badge-coral';
  const categoryLabel = CATEGORY_MAP[categoryKey] || product.category || 'General';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0 || added) return;

    await addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      image: product.images[0],
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card group">
      <Link to={`/product/${product.id}`} className="block">
        <div className="product-card-image">
          {!imgError && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-spring group-hover:scale-[1.04]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-cream-50">
              <div className="w-12 h-12 rounded-2xl bg-cream-200 flex items-center justify-center mb-2">
                <Heart size={22} weight="fill" className="text-coral-300" />
              </div>
              <span className="text-xs font-medium text-zinc-400">No preview</span>
            </div>
          )}
        </div>
      </Link>

      <div className="product-card-body">
        <div className="mb-2.5">
          <span className={`badge ${badgeClass}`}>{categoryLabel}</span>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-zinc-900 line-clamp-2 hover:text-coral-600 transition-colors duration-200 leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-body text-lg font-bold text-coral-600">
            {formatPrice(product.price)}
          </span>

          {showAddToCart && product.stock > 0 && !added && (
            <button
              onClick={handleAddToCart}
              className="p-2 rounded-xl bg-cream-50 text-coral-500 hover:bg-coral-500 hover:text-white
                         transition-all duration-200 ease-spring
                         active:scale-[0.92]"
              aria-label="Add to cart"
            >
              <ShoppingCart size={16} weight="bold" />
            </button>
          )}

          {added && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-600 animate-scale-in">
              <Heart size={14} weight="fill" className="text-coral-400" />
              Added
            </span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-amber-600 mt-2.5 font-medium">
            Only {product.stock} left
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-2.5 font-medium">
            Out of stock
          </p>
        )}
      </div>
    </div>
  );
});

export default ProductCard;
export type { Product, ProductCardProps };
