import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, type Variants } from 'framer-motion';
import {
  Heart,
  Gift,
  Handshake,
  Star,
  Sparkle,
  WhatsappLogo,
  ShoppingCart,
  ArrowRight,
} from '@phosphor-icons/react';
import { api } from '../../api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
  images: string[];
  createdAt: string;
}

const CATEGORIES = [
  { key: 'birthday', label: 'Birthday', icon: Gift, color: 'text-coral-600', bg: 'bg-coral-50' },
  { key: 'love', label: 'Love', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  { key: 'anniversary', label: 'Anniversary', icon: Heart, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'friendship', label: 'Friendship', icon: Handshake, color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'festival', label: 'Festival', icon: Star, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'sympathy', label: 'Sympathy', icon: Sparkle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
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
      {/* Asymmetric Split Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-[70dvh]">
            {/* Left: Content (7 cols) */}
            <div className="lg:col-span-7 lg:pr-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral-50 text-coral-600 text-sm font-medium mb-8">
                  <Sparkle size={14} />
                  Handcrafted greeting cards
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none text-neutral-900 max-w-[14ch]"
              >
                Say it with a{' '}
                <span className="text-coral-500">beautiful card</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-5 text-base sm:text-lg text-neutral-500 leading-relaxed max-w-[48ch]"
              >
                Greeting cards that speak from the heart. Order via WhatsApp — personal, warm, and delivered across Sri Lanka with care.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row items-start gap-3"
              >
                <MagneticButton to="/shop" label="Browse All Cards" />
                <a
                  href="https://wa.me/947XXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-base"
                >
                  <WhatsappLogo size={18} />
                  Chat with us
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex items-center gap-6 text-xs text-neutral-400"
              >
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  1,200+ orders delivered
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-coral-400" />
                  65+ unique designs
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  4.9 rating
                </span>
              </motion.div>
            </div>

            {/* Right: Floating card bento (5 cols) */}
            <div className="lg:col-span-5 relative h-[420px] lg:h-[520px] hidden lg:block">
              <FloatingCard
                rotate={10}
                yOffset={[0, -14, 0]}
                duration={6}
                className="absolute top-4 right-4 w-[240px] h-[320px] bg-gradient-to-br from-coral-50 to-rose-50 rounded-[2rem] border border-white/30 shadow-diffuse"
                icon={<Heart size={24} weight="fill" className="text-coral-400" />}
                title="Love"
                subtitle="Express your heart"
                delay={0}
              />
              <FloatingCard
                rotate={-6}
                yOffset={[0, 18, 0]}
                duration={7}
                className="absolute bottom-8 right-28 w-[220px] h-[280px] bg-gradient-to-br from-amber-50 to-coral-50 rounded-[2rem] border border-white/30 shadow-diffuse"
                icon={<Gift size={24} className="text-coral-400" />}
                title="Birthday"
                subtitle="Celebrate in style"
                delay={1}
              />
              <FloatingCard
                rotate={16}
                yOffset={[0, -10, 0]}
                duration={5}
                className="absolute top-20 right-52 w-[200px] h-[260px] bg-gradient-to-br from-rose-50 to-rose-100 rounded-[2rem] border border-white/30 shadow-diffuse"
                icon={<Star size={24} className="text-rose-400" />}
                title="Festival"
                subtitle="Spread the joy"
                delay={2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-eyebrow mb-3">Categories</span>
              <h2 className="section-heading mt-2">Shop by occasion</h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {CATEGORIES.slice(0, 3).map((cat) => (
              <motion.div key={cat.key} variants={itemVariants} className="sm:col-span-1">
                <CategoryCard category={cat} featured />
              </motion.div>
            ))}
            {CATEGORIES.slice(3).map((cat) => (
              <motion.div key={cat.key} variants={itemVariants} className="col-span-1">
                <CategoryCard category={cat} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-6 sm:hidden text-center">
            <Link to="/shop" className="text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors inline-flex items-center gap-1">
              View all categories <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-eyebrow mb-3">Featured</span>
              <h2 className="section-heading mt-2">Popular cards</h2>
              <p className="section-subheading mt-1">
                Our most-loved greeting cards, handpicked for every occasion
              </p>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-card overflow-hidden">
                  <div className="skeleton-card-image" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 skeleton-shimmer w-16" />
                    <div className="h-4 skeleton-shimmer" />
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-5 skeleton-shimmer w-20" />
                      <div className="h-8 skeleton-shimmer w-8 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                <Heart size={24} className="text-neutral-400" />
              </div>
              <p className="text-lg font-semibold text-neutral-600 mb-1">No cards yet</p>
              <p className="text-sm text-neutral-400 mb-6 max-w-[40ch]">
                We are adding new designs. Check back soon or browse our collection.
              </p>
              <Link to="/shop" className="btn-primary text-sm">
                Browse All Cards
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {featuredProducts.slice(0, 4).map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="mt-8 sm:hidden text-center">
            <Link to="/shop" className="btn-ghost text-sm">
              View All Cards
            </Link>
          </div>
        </div>
      </section>

      {/* About + Stats Split */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="section-eyebrow mb-3">About</span>
              <h2 className="section-heading mt-2">
                Bringing joy, one card at a time
              </h2>
              <p className="mt-5 text-base text-neutral-500 leading-relaxed">
                At TwinkleHearts, we believe every occasion deserves to be celebrated with something special. Our beautifully crafted greeting cards are designed to make your loved ones smile.
              </p>
              <p className="mt-4 text-base text-neutral-500 leading-relaxed">
                Based in Colombo, Sri Lanka, we offer a personal touch with easy ordering via WhatsApp. Browse our collection, choose your favorite cards, and we will handle the rest.
              </p>

              <div className="mt-8 space-y-4">
                <FeatureItem icon={Sparkle} title="Original designs" description="Handcrafted artwork for every occasion" />
                <FeatureItem icon={WhatsappLogo} title="Order via WhatsApp" description="Convenient, personal, and human" />
                <FeatureItem icon={ShoppingCart} title="Delivered with care" description="Fast and reliable delivery across Sri Lanka" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard value="1,240" label="Orders delivered" />
              <StatCard value="4.9" label="Average rating" />
              <StatCard value="580+" label="Happy customers" />
              <StatCard value="65" label="Unique designs" />
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to make someone smile?
          </h2>
          <p className="text-base text-neutral-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Browse our collection of greeting cards and find the perfect message for your loved ones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <MagneticButton to="/shop" label="Shop All Cards" dark />
            <a
              href="https://wa.me/947XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-all active:scale-[0.98]"
            >
              <WhatsappLogo size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Grain overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none grain" />
    </div>
  );
}

/* ---- Magnetic Button (isolated client component) ---- */

function MagneticButton({ to, label, dark }: { to: string; label: string; dark?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.sqrt((e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2);
    const maxDist = 150;
    if (dist > maxDist) {
      x.set(0);
      y.set(0);
      return;
    }
    const strength = 0.3;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={to}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={`inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
        dark
          ? 'bg-white text-neutral-900 hover:bg-neutral-100'
          : 'bg-coral-500 hover:bg-coral-600 text-white shadow-soft'
      }`}
    >
      {label}
    </motion.a>
  );
}

/* ---- Floating Card (isolated perpetual micro-interaction) ---- */

function FloatingCard({
  rotate,
  yOffset,
  duration,
  className,
  icon,
  title,
  subtitle,
  delay,
}: {
  rotate: number;
  yOffset: number[];
  duration: number;
  className: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 0 }}
      animate={{
        opacity: 1,
        rotate,
        y: yOffset,
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.4 + delay * 0.15 },
        rotate: { duration: 0.6, delay: 0.4 + delay * 0.15 },
        y: {
          repeat: Infinity,
          duration,
          ease: 'easeInOut',
          delay: delay * 0.5,
        },
      }}
      className={className}
    >
      <div className="p-6 sm:p-8 flex flex-col items-start justify-end h-full">
        <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mb-4">
          {icon}
        </div>
        <p className="text-neutral-800 font-semibold text-base sm:text-lg">{title}</p>
        <p className="text-neutral-500 text-sm">{subtitle}</p>
      </div>
    </motion.div>
  );
}

/* ---- Product Card with micro-interactions ---- */

function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const getCategoryBadge = (category?: string) => {
    const catMap: Record<string, string> = {
      birthday: 'Birthday',
      love: 'Love',
      anniversary: 'Anniversary',
      friendship: 'Friendship',
      festival: 'Festival',
      sympathy: 'Sympathy',
    };
    const key = category?.toLowerCase() || '';
    return catMap[key] || category || 'General';
  };

  return (
    <motion.div
      className="product-card group"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="product-card-image relative">
          {!imgError && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100">
              <div className="w-12 h-12 rounded-2xl bg-neutral-200 flex items-center justify-center mb-2">
                <Heart size={22} weight="fill" className="text-neutral-400" />
              </div>
              <span className="text-xs font-medium text-neutral-400">No preview</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="badge badge-coral">{getCategoryBadge(product.category)}</span>
          </div>
        </div>
      </Link>

      <div className="product-card-body">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-neutral-900 line-clamp-2 hover:text-coral-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-base font-semibold text-coral-600 tracking-tight">
            {formatPrice(product.price)}
          </span>

          {product.stock > 0 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-coral-500 hover:text-white transition-colors duration-200"
              aria-label="Add to cart"
            >
              <ShoppingCart size={15} weight="bold" />
            </motion.button>
          ) : (
            <span className="text-xs text-neutral-400 font-medium">Sold out</span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 3 && (
          <p className="text-xs text-amber-600 mt-2.5 font-medium">
            Only {product.stock} remaining
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ---- Category Card ---- */

function CategoryCard({ category, featured }: { category: (typeof CATEGORIES)[number]; featured?: boolean }) {
  const Icon = category.icon;

  return (
    <Link
      to={`/shop?category=${category.key}`}
      className={`flex flex-col items-start gap-3 p-5 rounded-2xl border border-neutral-100/80 transition-all duration-300 hover:shadow-diffuse active:scale-[0.98] ${
        featured ? `${category.bg} ${category.color}` : 'bg-white hover:bg-neutral-50'
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
        featured ? 'bg-white/60' : 'bg-neutral-100'
      }`}>
        <Icon size={22} className={featured ? category.color : 'text-neutral-500'} />
      </div>
      <div>
        <h3 className={`font-semibold text-sm ${featured ? category.color : 'text-neutral-800'}`}>
          {category.label}
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">Browse cards</p>
      </div>
    </Link>
  );
}

/* ---- Feature Item ---- */

function FeatureItem({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-coral-500" />
      </div>
      <div>
        <h4 className="font-semibold text-sm text-neutral-900">{title}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

/* ---- Stat Card ---- */

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
      <div className="font-mono text-2xl sm:text-3xl font-bold text-coral-600 mb-0.5 tracking-tight">
        {value}
      </div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}
