import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  sku?: string;
}

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
      image: product.images[0],
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const getCategoryBadge = (category: string) => {
    const catMap: Record<string, { label: string; variant: string }> = {
      birthday: { label: '🎂 Birthday', variant: 'badge-gold' },
      love: { label: '💕 Love', variant: 'badge-rose' },
      anniversary: { label: '🥂 Anniversary', variant: 'badge-sage' },
      friendship: { label: '🤝 Friendship', variant: 'badge-coral' },
      festival: { label: '🎊 Festival', variant: 'badge-gold' },
      sympathy: { label: '🕊️ Sympathy', variant: 'badge-sage' },
    };
    const cat = catMap[category?.toLowerCase()] || { label: category, variant: 'badge-coral' };
    return <span className={`badge ${cat.variant}`}>{cat.label}</span>;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="skeleton-card rounded-card overflow-hidden">
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
    );
  }

  if (!product) {
    return (
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
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-coral-600 transition-colors">Shop</Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="aspect-[4/5] bg-neutral-100 rounded-card overflow-hidden shadow-card mb-4">
            {product.images[activeImage] ? (
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22 viewBox=%220 0 400 500%22%3E%3Crect fill=%22%23F5E0D3%22 width=%22400%22 height=%22500%22/%3E%3Ctext fill=%22%239BB89B%22 font-family=%22serif%22 font-size=%2224%22 x=%2250%25%22 y=%2245%25%22 text-anchor=%22middle%22%3E💌%3C/text%3E%3Ctext fill=%22%23B04628%22 font-family=%22serif%22 font-size=%2216%22 x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22%3ECard Preview%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-200 text-neutral-300">
                <span className="text-5xl mb-3">💌</span>
                <span className="font-display text-lg">Card Preview</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                    activeImage === idx
                      ? 'border-coral-400 shadow-glow'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <img
                    src={image}
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
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-body text-3xl font-bold text-coral-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-500">incl. tax</span>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
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
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-neutral-100 hover:border-gray-300 transition-all text-gray-600 font-medium"
                >
                  −
                </button>
                <span className="w-12 text-center font-body text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-neutral-100 hover:border-gray-300 transition-all text-gray-600 font-medium"
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
            className="btn-ghost w-full justify-center mt-3 text-gray-600"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Have a question? Chat with us
          </a>

          {/* Details */}
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-700 capitalize">{product.category || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Delivery</dt>
                <dd className="font-medium text-emerald-600">Free via WhatsApp delivery 🇱🇰</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}
