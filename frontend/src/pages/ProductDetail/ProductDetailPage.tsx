import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import { getImageSrc } from '../../utils/images';
import type { Product } from '@twinkle-hearts/shared';
import { HeartIcon, WhatsAppIcon, formatPrice, CATEGORY_MAP, CATEGORY_BADGE } from '../../components/UI/Icons';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  async function fetchProduct(productId: string) {
    try {
      const data = await api.products.get(productId);
      setProduct(data.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return;

    await addItem({
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      image: Array.isArray(product.images) ? product.images[0] : undefined,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  const getCategoryBadge = (category?: string) => {
    const key = category?.toLowerCase() ?? '';
    const label = CATEGORY_MAP[key] || category || 'General';
    const variant = CATEGORY_BADGE[key] || 'badge-plum';
    return <span className={`badge ${variant}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="card overflow-hidden">
            <div className="skeleton-card-image aspect-[4/5]" />
          </div>
          <div className="space-y-6">
            <div className="skeleton-card-line h-8 w-3/4" />
            <div className="skeleton-card-line h-4 w-1/3" />
            <div className="skeleton-card-line h-6 w-1/4" />
            <div className="skeleton-card-line h-24 w-full" />
            <div className="skeleton-card-line h-12 w-full rounded-pill" />
          </div>
        </div>
      </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-full h-full" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="16" width="48" height="32" rx="4" />
                <path d="M8 20l24 16 24-16" />
              </svg>
            </div>
            <h3 className="empty-state-title">Card Not Found</h3>
            <p className="empty-state-text">This card may have been removed.</p>
          </div>
          <Link to="/" className="btn-primary mt-6">
            Back to Shop
          </Link>
        </div>
      </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="bg-twinkle-canvas min-h-screen">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-twinkle-ink/70 mb-8">
        <Link to="/" className="hover:text-twinkle-rose transition-colors">Shop</Link>
        <svg className="w-4 h-4 text-twinkle-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-twinkle-ink/70 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="aspect-[4/5] bg-twinkle-mist/20 rounded-xl overflow-hidden shadow-lg mb-4">
            {images[activeImage] ? (
              <img
                src={getImageSrc(images[activeImage])}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22 viewBox=%220 0 400 500%22%3E%3Crect fill=%22%23F5E0D3%22 width=%22400%22 height=%22500%22/%3E%3Ctext fill=%22%239BB89B%22 font-family=%22serif%22 font-size=%2224%22 x=%2250%25%22 y=%2245%25%22 text-anchor=%22middle%22%3E💌%3C/text%3E%3Ctext fill=%22%23B04628%22 font-family=%22serif%22 font-size=%2216%22 x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22%3ECard Preview%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-twinkle-mist/20 text-twinkle-ink/40">
                <span className="text-5xl mb-3">💌</span>
                <span className="font-display text-lg">Card Preview</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                    activeImage === idx
                      ? 'border-twinkle-rose shadow-lg'
                      : 'border-transparent hover:border-twinkle-mist'
                  }`}
                >
                  <img
                    src={getImageSrc(image)}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Category Badge */}
          <div className="mb-3">
            {getCategoryBadge(product.category)}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-twinkle-ink mb-3">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-body text-3xl font-bold text-twinkle-rose">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-twinkle-ink/50">incl. tax</span>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-twinkle-ink/70 leading-relaxed">{product.description}</p>
          </div>

          {/* Stock Status */}
          <div className={`flex items-center gap-2 mb-6 ${
            product.stock > 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {product.stock > 0
                ? `In Stock — ${product.stock} available`
                : 'Currently out of stock'}
            </span>
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-6">
              <label className="label-text">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-twinkle-mist flex items-center justify-center hover:bg-twinkle-mist/30 hover:border-twinkle-rose transition-all text-twinkle-ink/50 font-medium"
                >
                  −
                </button>
                <span className="w-12 text-center font-body text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-twinkle-mist flex items-center justify-center hover:bg-twinkle-mist/30 hover:border-twinkle-rose transition-all text-twinkle-ink/50 font-medium"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`btn-primary w-full py-3.5 text-base ${
              justAdded ? 'animate-heart-pop bg-emerald-500' : ''
            } ${
              product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {justAdded ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added to Cart!
              </>
            ) : product.stock === 0 ? (
              'Out of Stock'
            ) : (
              <>
                <HeartIcon className="w-5 h-5" />
                Add to Cart
              </>
            )}
          </button>

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/947XXXXXXXX?text=Hi!%20I%20have%20a%20question%20about%20this%20card."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full justify-center mt-3 text-twinkle-ink/50"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Have a question? Chat with us
          </a>

          {/* Details */}
          <div className="mt-8 pt-8 border-t border-twinkle-mist">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">Category</dt>
                <dd className="font-medium text-twinkle-ink/70 capitalize">{product.category || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">Delivery</dt>
                <dd className="font-medium text-emerald-600">Free via WhatsApp delivery 🇱🇰</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}


