import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const categoryParam = activeCategory === 'all' ? '' : `&category=${activeCategory}`;
      const response = await fetch(`/api/products?limit=20${categoryParam}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: ProductsResponse = await response.json();
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

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-warm-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* Floating sparkle decorations */}
            <div className="absolute top-8 left-12 w-2 h-2 bg-gold-300 rounded-full animate-float opacity-60 hidden lg:block" />
            <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-coral-300 rounded-full animate-float-slow opacity-40 hidden lg:block" />
            <div className="absolute bottom-12 left-1/4 w-2 h-2 bg-rose-300 rounded-full animate-float opacity-50 hidden lg:block" />

            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 badge badge-coral mb-6">
                <HeartSparkle className="w-3.5 h-3.5" />
                Handcrafted with love
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
                Say it with a{' '}
                <span className="text-coral-500 relative">
                  beautiful card
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5C40 2 80 2 199 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-coral-300" />
                  </svg>
                </span>
              </h1>
              <p className="font-body text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Greeting cards that speak from the heart. Order via WhatsApp — personal, warm, and delivered with care.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#cards" className="btn-primary text-base py-3 px-8">
                  Browse Cards
                </a>
                <a
                  href="https://wa.me/947XXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-base"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Chat with us
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-12 text-cream-50">
            <path
              d="M0 60V30C240 0 480 10 720 25C960 40 1200 50 1440 30V60H0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-cream-50 border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`category-pill ${
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
      <section id="cards" className="bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                {activeCategory === 'all' ? 'All Greeting Cards' : `${CATEGORIES.find(c => c.key === activeCategory)?.label} Cards`}
              </h2>
              <p className="text-gray-500 mt-1">
                {products.length} card{products.length !== 1 ? 's' : ''} to choose from
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
                    onClick={() => setActiveCategory('all')}
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

function HeartSparkle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
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

function EnvelopeIcon() {
  return (
    <svg className="w-full h-full" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="16" width="48" height="32" rx="4" />
      <path d="M8 20l24 16 24-16" />
    </svg>
  );
}
