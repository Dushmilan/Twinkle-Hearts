import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartSparkle, WhatsAppIcon } from '../../components/UI/Icons';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
}

const CATEGORIES = [
  { key: 'birthday', label: 'Birthday', emoji: '🎂' },
  { key: 'love', label: 'Love', emoji: '💕' },
  { key: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { key: 'friendship', label: 'Friendship', emoji: '🤝' },
  { key: 'festival', label: 'Festival', emoji: '🎊' },
  { key: 'sympathy', label: 'Sympathy', emoji: '🕊️' },
] as const;

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    setLoading(true);
    try {
      const response = await fetch('/api/products?limit=8');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setFeaturedProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
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
                <Link to="/shop" className="btn-primary text-base py-3 px-8">
                  Browse All Cards
                </Link>
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

      {/* Featured Products */}
      <section className="bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                Featured Cards
              </h2>
              <p className="text-gray-500 mt-1">
                Our most popular greeting cards
              </p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
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
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No featured cards available</p>
              <Link to="/shop" className="btn-primary mt-4 inline-block">
                Browse All Cards
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 4).map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${Math.min(index * 60, 240)}ms`, animationFillMode: 'forwards' }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="text-gray-500 mt-1">
              Find the perfect card for every occasion
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                to={`/shop?category=${cat.key}`}
                className="group card p-6 text-center hover:shadow-glow transition-all duration-300 border-2 border-transparent hover:border-coral-200"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </div>
                <h3 className="font-display font-semibold text-gray-900 group-hover:text-coral-600 transition-colors">
                  {cat.label}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-warm-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-flex items-center gap-2 badge badge-coral mb-6">
                <HeartSparkle className="w-3.5 h-3.5" />
                About TwinkleHearts
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Bringing joy, one card at a time
              </h2>
              <p className="font-body text-lg text-gray-600 mb-4 leading-relaxed">
                At TwinkleHearts, we believe every occasion deserves to be celebrated with something special. Our beautifully crafted greeting cards are designed to make your loved ones smile.
              </p>
              <p className="font-body text-lg text-gray-600 mb-6 leading-relaxed">
                Based in Sri Lanka 🇱🇰, we offer a personal touch with easy ordering via WhatsApp. Simply browse our collection, choose your favorite cards, and we'll handle the rest!
              </p>

              {/* Features */}
              <div className="space-y-4">
                <FeatureItem icon="✨" title="Beautiful Designs" description="Handpicked designs that speak from the heart" />
                <FeatureItem icon="💌" title="Easy Ordering" description="Order conveniently via WhatsApp" />
                <FeatureItem icon="🚚" title="Fast Delivery" description="Quick and reliable delivery across Sri Lanka" />
                <FeatureItem icon="💝" title="Personal Touch" description="Add custom messages to make it special" />
              </div>
            </div>

            {/* Right Content - Stats */}
            <div className="grid grid-cols-2 gap-6">
              <StatCard number="1000+" label="Happy Customers" />
              <StatCard number="500+" label="Cards Delivered" />
              <StatCard number="50+" label="Unique Designs" />
              <StatCard number="4.9" label="Average Rating" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-coral-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to spread some joy?
          </h2>
          <p className="text-lg text-coral-100 mb-8">
            Browse our collection and find the perfect card for your loved ones
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/shop" className="bg-white text-coral-600 hover:bg-cream-50 px-8 py-3 rounded-lg font-semibold transition-colors">
              Shop Now
            </Link>
            <a
              href="https://wa.me/947XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-coral-600 hover:bg-coral-700 px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---- Product Card sub-component ----

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
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

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <span className="font-body text-lg font-bold text-coral-600">
            {formatPrice(product.price)}
          </span>
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

// ---- Sub-components ----

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-white rounded-card p-6 text-center shadow-soft">
      <div className="text-3xl font-display font-bold text-coral-600 mb-2">
        {number}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}


