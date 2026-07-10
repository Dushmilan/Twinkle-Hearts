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
import { getImageSrc } from '../../utils/images';
import type { ProductListItem } from '@twinkle-hearts/shared';

const CATEGORIES = [
  { key: 'birthday', label: 'Birthday', icon: Gift, color: 'text-greeting-magenta-400', bg: 'bg-greeting-magenta-500/20' },
  { key: 'love', label: 'Love', icon: Heart, color: 'text-greeting-pink-400', bg: 'bg-greeting-pink-500/20' },
  { key: 'anniversary', label: 'Anniversary', icon: Heart, color: 'text-greeting-cyan-400', bg: 'bg-greeting-cyan-500/20' },
  { key: 'friendship', label: 'Friendship', icon: Handshake, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  { key: 'festival', label: 'Festival', icon: Star, color: 'text-greeting-magenta-300', bg: 'bg-greeting-magenta-500/20' },
  { key: 'sympathy', label: 'Sympathy', icon: Sparkle, color: 'text-greeting-purple-400', bg: 'bg-greeting-purple-500/20' },
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
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItem[]>([]);
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
    <div className="relative">
      {/* Trilingual Asymmetric Hero */}
      <section className="relative overflow-hidden bg-greeting-bg-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-[70dvh]">
            {/* Left: Trilingual hero stack (7 cols) */}
            <div className="lg:col-span-7 lg:pr-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="section-eyebrow mb-8 inline-flex">
                  <Sparkle size={12} />
                  Handcrafted greeting cards
                </span>
              </motion.div>

              {/* EN line */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="trilingual-line-en text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight-display leading-[1.05]"
              >
                Say it with a
              </motion.h1>

              {/* TA line */}
              <motion.p
                lang="ta"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="trilingual-line-ta text-2xl sm:text-3xl lg:text-4xl mt-2 leading-snug"
              >
                <span className="text-greeting-magenta-400">ஒரு அழகான</span> அட்டையுடன்
              </motion.p>

              {/* SI line */}
              <motion.p
                lang="si"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="trilingual-line-si text-2xl sm:text-3xl lg:text-4xl mt-1 leading-snug"
              >
                <span className="text-greeting-magenta-400">ලස්සන කාඩ්</span> එකකින් කියන්න
              </motion.p>

              {/* EN finish */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="trilingual-line-en text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight-display leading-[1.05] mt-1"
              >
                <span className="text-greeting-magenta-400">beautiful card</span>
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-6 text-base sm:text-lg text-gray-400 leading-relaxed max-w-[48ch] font-body"
              >
                Greeting cards that speak from the heart. Order via WhatsApp — personal, warm, and delivered across Sri Lanka with care.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
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
                transition={{ delay: 0.7 }}
                className="mt-12 flex items-center gap-6 text-xs text-gray-500"
              >
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-greeting-cyan-400" />
                  1,200+ orders delivered
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-greeting-magenta-400" />
                  65+ unique designs
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  4.9 rating
                </span>
              </motion.div>
            </div>

            {/* Right: Floating letterpress card mockups (5 cols) */}
            <div className="lg:col-span-5 relative h-[460px] lg:h-[560px] hidden lg:block">
              <FloatingLetterpressCard
                rotate={6}
                yOffset={[0, -12, 0]}
                duration={6}
                className="absolute top-2 right-2 w-[260px] h-[340px] z-20"
                title="With Love"
                subtitle="For someone special"
                accent="magenta"
                delay={0}
              />
              <FloatingLetterpressCard
                rotate={-4}
                yOffset={[0, 16, 0]}
                duration={7}
                className="absolute bottom-4 right-36 w-[240px] h-[310px] z-10"
                title="Happy Birthday"
                subtitle="Celebrate in style"
                accent="cyan"
                delay={1}
              />
              <FloatingLetterpressCard
                rotate={12}
                yOffset={[0, -8, 0]}
                duration={5}
                className="absolute top-24 right-56 w-[220px] h-[280px] z-0"
                title="Joy & Peace"
                subtitle="Warm wishes"
                accent="magenta"
                delay={2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="bg-greeting-bg-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-eyebrow mb-3">Categories</span>
              <h2 className="section-heading mt-2">Shop by occasion</h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-greeting-magenta-400 hover:text-greeting-magenta-300 transition-colors font-body"
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
            {CATEGORIES.map((cat) => (
              <motion.div key={cat.key} variants={itemVariants} className="col-span-1">
                <Link
                  to={`/shop?category=${cat.key}`}
                  className={`flex flex-col items-start gap-4 p-5 rounded-2xl border transition-all duration-300 active:scale-[0.97] ${
                    cat.key === 'birthday'
                      ? `${cat.bg} ${cat.color} border-greeting-purple-700 hover:shadow-lg`
                      : 'bg-greeting-bg-400 border-greeting-purple-700 hover:bg-greeting-bg-500 hover:shadow-lg'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-greeting-bg-500/50`}>
                    <cat.icon size={22} className={cat.key === 'birthday' ? cat.color : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${
                      cat.key === 'birthday' ? cat.color : 'text-gray-300'
                    }`}>
                      {cat.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Browse cards</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-6 sm:hidden text-center">
            <Link to="/shop" className="text-sm font-semibold text-greeting-magenta-400 hover:text-greeting-magenta-300 transition-colors inline-flex items-center gap-1 font-body">
              View all categories <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-greeting-bg-400">
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
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-greeting-magenta-400 hover:text-greeting-magenta-300 transition-colors font-body"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
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
              <div className="empty-state-icon">
                <Heart size={24} />
              </div>
              <p className="empty-state-title">No cards yet</p>
              <p className="empty-state-text">
                We are adding new designs. Check back soon or browse our collection.
              </p>
              <Link to="/shop" className="btn-primary text-sm mt-6">
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
      <section className="bg-greeting-bg-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="section-eyebrow mb-3">About</span>
              <h2 className="section-heading mt-2">
                Bringing joy, one card at a time
              </h2>
              <p className="mt-5 text-base text-gray-400 leading-relaxed font-body">
                At TwinkleHearts, we believe every occasion deserves to be celebrated with something special. Our beautifully crafted greeting cards are designed to make your loved ones smile.
              </p>
              <p className="mt-4 text-base text-gray-400 leading-relaxed font-body">
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

      {/* CTA — Warm paper bridge */}
      <section className="bg-greeting-bg-500 text-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(214,54,142,0.06), transparent)',
        }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center relative z-10">
          <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-greeting-magenta-400 mb-5">
            Handwritten with care
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight mb-4 text-gray-50">
            Ready to make someone smile?
          </h2>
          <p className="text-base text-gray-400 mb-10 max-w-md mx-auto leading-relaxed font-body">
            Browse our collection of greeting cards and find the perfect message for your loved ones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[10px] bg-greeting-magenta-500 text-gray-100 hover:bg-greeting-magenta-600 font-semibold text-sm transition-all active:scale-[0.98] shadow-lg shadow-greeting-magenta-500/20"
            >
              Shop All Cards
            </Link>
            <a
              href="https://wa.me/947XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/30 text-gray-200 font-medium text-sm transition-all active:scale-[0.98]"
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

/* ---- Floating Letterpress Card (3D paper card mockup) ---- */

function FloatingLetterpressCard({
  rotate,
  yOffset,
  duration,
  className,
  title,
  subtitle,
  accent,
  delay,
}: {
  rotate: number;
  yOffset: number[];
  duration: number;
  className: string;
  title: string;
  subtitle: string;
  accent: 'magenta' | 'cyan';
  delay: number;
}) {
  const accentBorder = accent === 'magenta' ? 'border-greeting-magenta-500/30' : 'border-greeting-cyan-500/30';
  const accentBg = accent === 'magenta' ? 'bg-greeting-magenta-500/20' : 'bg-greeting-cyan-500/20';
  const accentText = accent === 'magenta' ? 'text-greeting-magenta-400' : 'text-greeting-cyan-400';
  const accentLight = accent === 'magenta' ? 'bg-greeting-magenta-500/30' : 'bg-greeting-cyan-500/30';

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
      <div className={`w-full h-full rounded-[2rem] ${accentBg} border ${accentBorder} shadow-lg flex flex-col overflow-hidden`}>
        {/* Card face — decorative top */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className={`w-14 h-14 rounded-full ${accentLight} flex items-center justify-center mb-5`}>
            <Heart size={22} weight="fill" className={accentText} />
          </div>
          <p className={`text-center font-display font-semibold text-lg ${accentText} leading-tight`}>
            {title}
          </p>
          <p className="text-center text-sm text-gray-500 mt-1.5 font-body">
            {subtitle}
          </p>
        </div>
        {/* Card footer — decorative stripe */}
        <div className={`h-1.5 ${accent === 'magenta' ? 'bg-greeting-magenta-500/20' : 'bg-greeting-cyan-500/20'}`} />
      </div>
    </motion.div>
  );
}

/* ---- Magnetic Button ---- */

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
      className={`inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-[10px] font-semibold text-sm transition-all active:scale-[0.98] ${
        dark
          ? 'bg-white text-gray-100 hover:bg-gray-100'
          : 'bg-greeting-magenta-500 hover:bg-greeting-magenta-600 text-gray-100 shadow-lg'
      }`}
    >
      {label}
    </motion.a>
  );
}

/* ---- Product Card ---- */

function ProductCard({ product }: { product: ProductListItem }) {
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
              src={getImageSrc(product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-greeting-bg-400">
              <div className="w-12 h-12 rounded-2xl bg-greeting-bg-500 flex items-center justify-center mb-2">
                <Heart size={22} weight="fill" className="text-gray-500" />
              </div>
              <span className="text-xs font-medium text-gray-500">No preview</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="badge badge-magenta">{getCategoryBadge(product.category)}</span>
          </div>
        </div>
      </Link>

      <div className="product-card-body">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold text-gray-100 line-clamp-2 hover:text-greeting-magenta-400 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-base font-semibold text-greeting-magenta-400 tracking-tight">
            {formatPrice(product.price)}
          </span>

          {product.stock > 0 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-xl bg-greeting-bg-400 text-gray-400 hover:bg-greeting-magenta-500 hover:text-gray-100 transition-colors duration-200"
              aria-label="Add to cart"
            >
              <ShoppingCart size={15} weight="bold" />
            </motion.button>
          ) : (
            <span className="text-xs text-gray-500 font-medium">Sold out</span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 3 && (
          <p className="text-xs text-greeting-magenta-400 mt-2.5 font-medium">
            Only {product.stock} remaining
          </p>
        )}
      </div>
    </motion.div>
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
      <div className="w-10 h-10 rounded-xl bg-greeting-magenta-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-greeting-magenta-400" />
      </div>
      <div>
        <h4 className="font-semibold text-sm text-gray-100">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

/* ---- Stat Card ---- */

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card">
      <div className="font-mono text-2xl sm:text-3xl font-bold text-greeting-magenta-400 mb-0.5 tracking-tight">
        {value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
