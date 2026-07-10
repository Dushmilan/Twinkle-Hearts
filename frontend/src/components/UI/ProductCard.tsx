'use client';

import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { CATEGORY_MAP, CATEGORY_BADGE, formatPrice } from './Icons';
import { getImageSrc } from '../../utils/images';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
}

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

const ProductCard = memo(function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

    const categoryKey = product.category?.toLowerCase() || '';
  const badgeClass = CATEGORY_BADGE[categoryKey] || 'badge-berry';
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
    <motion.div
      className="card group overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[3/4] bg-greeting-charcoal-800 relative">
          {!imgError && product.images[0] ? (
            <img
              src={getImageSrc(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-spring group-hover:scale-[1.04]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-greeting-charcoal-800">
              <div className="w-12 h-12 rounded-2xl bg-greeting-cocoa-800 flex items-center justify-center mb-2">
                <Heart size={22} fill="currentColor" className="text-greeting-teal-400" />
              </div>
              <span className="text-xs font-medium text-greeting-teal-400">No preview</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={`badge ${badgeClass}`}>{categoryLabel}</span>
          </div>
        </div>
      </Link>

      <div className="p-4 pb-5">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-gray-100 line-clamp-2 hover:text-greeting-berry-400 transition-colors duration-200 leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-base font-semibold text-greeting-berry-400 tracking-tight">
            {formatPrice(product.price)}
          </span>

          {showAddToCart && product.stock > 0 && !added && (
            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-xl bg-greeting-charcoal-800 text-gray-400 hover:bg-greeting-berry-500 hover:text-white transition-colors duration-200 ease-spring"
              aria-label="Add to cart"
            >
              <ShoppingCart size={15} />
            </motion.button>
          )}

          {added && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
            >
              <Heart size={13} fill="currentColor" className="text-greeting-berry-400" />
              Added
            </motion.span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 3 && (
          <p className="text-xs text-amber-600 mt-2.5 font-medium">
            Only {product.stock} remaining
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-2.5 font-medium">Sold out</p>
        )}
      </div>
    </motion.div>
  );
});

export default ProductCard;
export type { Product, ProductCardProps };
