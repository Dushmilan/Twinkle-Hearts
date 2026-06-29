import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Gift,
  Handshake,
  Star,
  Sparkle,
  WhatsappLogo,
  ShoppingCart,
} from '@phosphor-icons/react';
import { api } from '../../api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category?: string;
  images: string[];
  createdAt: string;
}

const CATEGORIES = [
  { key: 'birthday', label: 'Birthday', icon: Gift, gradient: 'from-amber-100 to-amber-200', color: 'text-amber-600' },
  { key: 'love', label: 'Love', icon: Heart, gradient: 'from-rose-100 to-rose-200', color: 'text-rose-600' },
  { key: 'anniversary', label: 'Anniversary', icon: Heart, gradient: 'from-violet-100 to-violet-200', color: 'text-violet-600' },
  { key: 'friendship', label: 'Friendship', icon: Handshake, gradient: 'from-sky-100 to-sky-200', color: 'text-sky-600' },
  { key: 'festival', label: 'Festival', icon: Star, gradient: 'from-yellow-100 to-yellow-200', color: 'text-yellow-600' },
  { key: 'sympathy', label: 'Sympathy', icon: Sparkle, gradient: 'from-green-100 to-green-200', color: 'text-green-600' },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    setLoading(true);
    try {
      const data = await api.products.list({ limit: 8 });
      setFeaturedProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Asymmetric Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80dvh]">
            {/* Left: Text */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-100 text-coral-700 text-sm font-medium mb-8">
                  <Sparkle size={14} />
                  Handcrafted with love
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-none text-zinc-900"
              >
                Say it with a{' '}
                <span className="text-coral-500 relative">
                  beautiful card
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5C40 2 80 2 199 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-coral-300" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-[48ch]"
              >
                Greeting cards that speak from the heart. Order via WhatsApp — personal, warm, and delivered with care.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-start gap-4"
              >
                <Link to="/shop" className="btn-primary text-base py-3 px-8">
                  Browse All Cards
                </Link>
                <a
                  href="https://wa.me/947XXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-base"
                >
                  <WhatsappLogo size={20} />
                  Chat with us
                </a>
              </motion.div>
            </div>

            {/* Right: Decorative card stack */}
            <div className="relative h-[500px] hidden lg:block">
              <motion.div
                animate={{
                  rotate: 8,
                  y: [0, -12, 0],
                }}
                transition={{
                  rotate: { duration: 1 },
                  y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
                }}
                className="absolute top-0 right-0 w-72 h-96 bg-gradient-to-br from-coral-100 to-rose-200 rounded-[2.5rem] shadow-xl shadow-coral-200/20 border border-white/50"
              >
                <div className="p-8 flex flex-col items-start justify-end h-full">
                  <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center mb-4">
                    <Heart size={28} weight="fill" className="text-coral-400" />
                  </div>
                  <p className="text-coral-700 font-semibold text-lg">Love</p>
                  <p className="text-coral-500 text-sm">Express your heart</p>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  rotate: -4,
                  y: [0, 16, 0],
                }}
                transition={{
                  rotate: { duration: 1 },
                  y: { repeat: Infinity, duration: 8, ease: 'easeInOut' },
                }}
                className="absolute bottom-0 right-16 w-64 h-80 bg-gradient-to-br from-amber-100 to-coral-200 rounded-[2.5rem] shadow-xl shadow-amber-200/20 border border-white/50"
              >
                <div className="p-8 flex flex-col items-start justify-end h-full">
                  <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center mb-4">
                    <Gift size={28} className="text-coral-400" />
                  </div>
                  <p className="text-coral-700 font-semibold text-lg">Birthday</p>
                  <p className="text-coral-500 text-sm">Celebrate in style</p>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  rotate: 14,
                  y: [0, -8, 0],
                }}
                transition={{
                  rotate: { duration: 1 },
                  y: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                }}
                className="absolute top-16 right-32 w-56 h-72 bg-gradient-to-br from-rose-100 to-rose-200 rounded-[2.5rem] shadow-xl shadow-rose-200/20 border border-white/50"
              >
                <div className="p-8 flex flex-col items-start justify-end h-full">
                  <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center mb-4">
                    <Star size={28} className="text-rose-400" />
                  </div>
                  <p className="text-rose-700 font-semibold text-lg">Festival</p>
                  <p className="text-rose-500 text-sm">Spread the joy</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
              Shop by Category
            </h2>
            <p className="mt-2 text-zinc-500 text-balance">
              Find the perfect card for every occasion
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.key} category={cat} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                Featured Cards
              </h2>
              <p className="mt-2 text-zinc-500 text-balance">
                Our most popular greeting cards
              </p>
            </div>
            <Link to="/shop" className="text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors flex items-center gap-1">
              View All
              <span className="inline-block ml-1">&rarr;</span>
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
              <p className="text-zinc-500">No featured cards available</p>
              <Link to="/shop" className="btn-primary mt-4 inline-block">
                Browse All Cards
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {featuredProducts.slice(0, 4).map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-100 text-coral-700 text-sm font-medium mb-6">
                <Sparkle size={14} />
                About TwinkleHearts
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-6">
                Bringing joy, one card at a time
              </h2>
              <p className="text-lg text-zinc-500 mb-4 leading-relaxed">
                At TwinkleHearts, we believe every occasion deserves to be celebrated with something special. Our beautifully crafted greeting cards are designed to make your loved ones smile.
              </p>
              <p className="text-lg text-zinc-500 mb-8 leading-relaxed">
                Based in Sri Lanka, we offer a personal touch with easy ordering via WhatsApp. Simply browse our collection, choose your favorite cards, and we will handle the rest.
              </p>

              <div className="space-y-4">
                <FeatureItem icon={Sparkle} title="Beautiful Designs" description="Handpicked designs that speak from the heart" />
                <FeatureItem icon={WhatsappLogo} title="Easy Ordering" description="Order conveniently via WhatsApp" />
                <FeatureItem icon={ShoppingCart} title="Fast Delivery" description="Quick and reliable delivery across Sri Lanka" />
                <FeatureItem icon={Heart} title="Personal Touch" description="Add custom messages to make it special" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard number="1,200+" label="Happy Customers" />
              <StatCard number="580+" label="Cards Delivered" />
              <StatCard number="65+" label="Unique Designs" />
              <StatCard number="4.9" label="Average Rating" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-coral-500 to-coral-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to spread some joy?
          </h2>
          <p className="text-lg text-coral-100 mb-8 text-balance max-w-xl mx-auto">
            Browse our collection and find the perfect card for your loved ones
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/shop"
              className="bg-white text-coral-600 hover:bg-stone-50 px-8 py-3 rounded-lg font-semibold transition-all active:scale-[0.98]"
            >
              Shop Now
            </Link>
            <a
              href="https://wa.me/947XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-coral-600 hover:bg-coral-700 px-8 py-3 rounded-lg font-semibold transition-all active:scale-[0.98] inline-flex items-center gap-2"
            >
              <WhatsappLogo size={20} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---- Product Card ---- */

function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const getCategoryBadge = (category?: string) => {
    const catMap: Record<string, { label: string }> = {
      birthday: { label: 'Birthday' },
      love: { label: 'Love' },
      anniversary: { label: 'Anniversary' },
      friendship: { label: 'Friendship' },
      festival: { label: 'Festival' },
      sympathy: { label: 'Sympathy' },
    };
    const key = category?.toLowerCase() || '';
    const cat = catMap[key] || { label: category || 'General' };
    return <span className="badge badge-coral">{cat.label}</span>;
  };

  return (
    <div className="product-card group">
      <Link to={`/product/${product.id}`} className="block">
        <div className="product-card-image">
          {!imgError && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center mb-2">
                <Heart size={24} className="text-zinc-400" />
              </div>
              <span className="text-sm font-medium text-zinc-400">Card Preview</span>
            </div>
          )}
        </div>
      </Link>

      <div className="product-card-body">
        <div className="mb-2">
          {getCategoryBadge(product.category)}
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-base font-semibold text-zinc-900 mb-2 line-clamp-2 hover:text-coral-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-body text-lg font-bold text-coral-600">
            {formatPrice(product.price)}
          </span>
        </div>

        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
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

/* ---- Category Card ---- */

function CategoryCard({
  category,
}: {
  category: (typeof CATEGORIES)[number];
}) {
  const Icon = category.icon;

  return (
    <motion.div
      variants={itemVariants}
      className="group"
    >
      <Link
        to={`/shop?category=${category.key}`}
        className={`flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br ${category.gradient} border border-white/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]`}
      >
        <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
          <Icon size={24} className={category.color} />
        </div>
        <div>
          <h3 className={`font-semibold text-base ${category.color}`}>
            {category.label}
          </h3>
          <p className="text-sm text-zinc-500">Browse collection</p>
        </div>
      </Link>
    </motion.div>
  );
}

/* ---- Sub-components ---- */

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-coral-600" />
      </div>
      <div>
        <h4 className="font-semibold text-zinc-900">{title}</h4>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center border border-zinc-200/50">
      <div className="text-3xl font-display font-bold text-coral-600 mb-1">
        {number}
      </div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}
