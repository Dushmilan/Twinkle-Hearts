import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category?: string;
}

const CATEGORIES = [
  { key: 'all', label: 'All Cards', emoji: '✨' },
  { key: 'birthday', label: 'Birthday', emoji: '🎂' },
  { key: 'love', label: 'Love', emoji: '💕' },
  { key: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { key: 'friendship', label: 'Friendship', emoji: '🤝' },
  { key: 'festival', label: 'Festival', emoji: '🎊' },
  { key: 'sympathy', label: 'Sympathy', emoji: '🕊️' },
] as const;

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    // Get category from URL params
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== activeCategory) {
      setActiveCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const category = activeCategory === 'all' ? undefined : activeCategory;
      const data = await api.products.list({ limit: 20, category });
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(product: Product) {
    await addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      image: product.images[0],
    });
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Page Header */}
      <section className="bg-warm-gradient border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Browse Our Collection
            </h1>
            <p className="font-body text-lg text-gray-600">
              Beautiful greeting cards for every occasion
            </p>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-white border-b border-cream-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`category-pill whitespace-nowrap ${
                  activeCategory === cat.key ? 'category-pill-active' : ''
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                {activeCategory === 'all' ? 'All Greeting Cards' : `${CATEGORIES.find(c => c.key === activeCategory)?.label} Cards`}
              </h2>
              <p className="text-gray-500 mt-1">
                {products.length} card{products.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-card rounded-card overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="skeleton-card-image" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton-card-line" />
                    <div className="skeleton-card-line-short" />
                    <div className="flex justify-between items-center">
                      <div className="skeleton-card-line w-16 h-6" />
                      <div className="skeleton-card-line w-20 h-8 rounded-pill" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">{error}</p>
              <button onClick={fetchProducts} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <EnvelopeIcon />
                  </div>
                  <h3 className="empty-state-title">No cards in this category yet</h3>
                  <p className="empty-state-text">Check back soon — we're always adding new designs!</p>
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="btn-ghost mt-6"
                  >
                    View all cards
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-up opacity-0"
                      style={{ animationDelay: `${Math.min(index * 60, 420)}ms`, animationFillMode: 'forwards' }}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// ---- Product Card sub-component ----

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const getCategoryBadge = (category?: string) => {
    const catMap: Record<string, { label: string; variant: string }> = {
      birthday: { label: '🎂 Birthday', variant: 'badge-gold' },
      love: { label: '💕 Love', variant: 'badge-rose' },
      anniversary: { label: '🥂 Anniversary', variant: 'badge-sage' },
      friendship: { label: '🤝 Friendship', variant: 'badge-coral' },
      festival: { label: '🎊 Festival', variant: 'badge-gold' },
      sympathy: { label: '🕊️ Sympathy', variant: 'badge-sage' },
    };
    const key = category?.toLowerCase() || '';
    const cat = catMap[key] || { label: category || 'General', variant: 'badge-coral' };
    return <span className={`badge ${cat.variant}`}>{cat.label}</span>;
  };

  return (
    <div className="product-card group">
      {/* Product Image */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="product-card-image">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22 viewBox=%220 0 300 400%22%3E%3Crect fill=%22%23F5E0D3%22 width=%22300%22 height=%22400%22/%3E%3Ctext fill=%22%239BB89B%22 font-family=%22serif%22 font-size=%2218%22 x=%2250%25%22 y=%2245%25%22 text-anchor=%22middle%22%3E💌%3C/text%3E%3Ctext fill=%22%23B04628%22 font-family=%22serif%22 font-size=%2214%22 x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22%3ECard Preview%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-cream-200 text-cream-300">
              <span className="text-3xl mb-2">💌</span>
              <span className="text-sm font-display">Card Preview</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="product-card-body">
        {/* Category Badge */}
        <div className="mb-2">
          {getCategoryBadge(product.category)}
        </div>

        {/* Title */}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-coral-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-3">
          <span className="font-body text-lg font-bold text-coral-600">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
              product.stock === 0
                ? 'opacity-40 cursor-not-allowed bg-gray-100'
                : 'bg-coral-500 hover:bg-coral-600 active:scale-90 text-white shadow-soft hover:shadow-glow'
            }`}
            title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          >
            <HeartIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Stock indicator */}
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-gold-600 mt-2 font-medium">
            Only {product.stock} left
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-2 font-medium">
            Out of stock
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Icons ----

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg className="w-full h-full" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="16" width="48" height="32" rx="4" />
      <path d="M8 20l24 16 24-16" />
    </svg>
  );
}
