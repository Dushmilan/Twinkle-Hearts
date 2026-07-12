import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from '../../utils/gsap-utils';
import {
  Heart,
  Gift,
  Handshake,
  Star,
  Sparkle,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import ProductCard from '../../components/UI/ProductCard';
import { TextGenerateEffect } from '../../components/UI/text-generate-effect';
import { SparklesCore } from '../../components/UI/sparkles';
import { api } from '../../api';
import type { ProductListItem } from '@twinkle-hearts/shared';

function WhatsappLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const CATEGORIES = [
  { key: 'birthday', label: 'Birthday', icon: Gift, color: 'text-twinkle-rose', bg: 'bg-twinkle-rose/20' },
  { key: 'love', label: 'Love', icon: Heart, color: 'text-twinkle-rose', bg: 'bg-twinkle-rose/20' },
  { key: 'anniversary', label: 'Anniversary', icon: Heart, color: 'text-twinkle-sage', bg: 'bg-twinkle-sage/20' },
  { key: 'friendship', label: 'Friendship', icon: Handshake, color: 'text-twinkle-ink/50', bg: 'bg-twinkle-ink/10' },
  { key: 'festival', label: 'Festival', icon: Star, color: 'text-twinkle-rose', bg: 'bg-twinkle-rose/20' },
  { key: 'sympathy', label: 'Sympathy', icon: Sparkle, color: 'text-twinkle-mist', bg: 'bg-twinkle-mist/20' },
] as const;

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Nipun S.',
    role: 'Sent to Mom',
    quote: 'I sent this to my mom on her 60th birthday and she cried happy tears. The card was beautiful and the WhatsApp ordering made it so easy.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Amara K.',
    role: 'Sent to best friend',
    quote: 'Such a meaningful way to say "I miss you." My friend in Jaffna loved it. Thank you for making this possible!',
    rating: 5,
  },
  {
    id: '3',
    name: 'David L.',
    role: 'Anniversary surprise',
    quote: 'Ordered three cards for my wife\'s birthday. Each one was more beautiful than the last. The personal touch really shows.',
    rating: 5,
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    if (heroRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero-eyebrow', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo('.hero-line-1', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .fromTo('.hero-line-2', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .fromTo('.hero-line-3', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .fromTo('.hero-line-4', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .fromTo('.hero-buttons', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
        .fromTo('.hero-stats', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.1');
    }

    const floaters = heroRef.current?.querySelectorAll('.floating-card');
    if (floaters) {
      gsap.fromTo(
        floaters,
        { opacity: 0, y: 30, rotate: '0deg' },
        { opacity: 1, y: 0, rotate: (i) => [6, -4, 12][i], duration: 0.6, stagger: 0.15, ease: 'back.out(1.4)', delay: 0.4 },
      );
      gsap.to(floaters, { y: '+=12', duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 1 });
    }
  }, []);

  useEffect(() => {
    if (!categoriesRef.current) return;
    const items = categoriesRef.current.querySelectorAll('.category-item');
    gsap.fromTo(items, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: categoriesRef.current, start: 'top 85%' } });
  }, []);

  useEffect(() => {
    if (!featuredRef.current || featuredProducts.length === 0) return;
    const items = featuredRef.current.querySelectorAll('.featured-item');
    gsap.fromTo(items, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: featuredRef.current, start: 'top 85%' } });
    ScrollTrigger.refresh();
  }, [featuredProducts]);

  useEffect(() => {
    if (!testimonialsRef.current) return;
    const items = testimonialsRef.current.querySelectorAll('.testimonial-card');
    gsap.fromTo(items, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: testimonialsRef.current, start: 'top 85%' } });
  }, []);

  useEffect(() => {
    if (!aboutRef.current) return;
    const tween = gsap.fromTo(
      aboutRef.current.querySelectorAll('.about-item'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: aboutRef.current, start: 'top 85%' } },
    );
    const stats = aboutRef.current.querySelectorAll('.stat-card');
    gsap.fromTo(stats, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.4)', scrollTrigger: { trigger: aboutRef.current, start: 'top 85%' } });
    return () => { tween.kill(); };
  }, []);

  useEffect(() => {
    if (!ctaRef.current) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: ctaRef.current, start: 'top 85%' } });
    tl.fromTo('.cta-content', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    return () => { tl.kill(); };
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
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-white via-twinkle-canvas to-twinkle-sage/20">
        <SparklesCore
          className="absolute inset-0 z-0"
          particleColor="#d48a7a"
          particleDensity={30}
          minSize={0.5}
          maxSize={1.5}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-[70dvh]">
            <div className="lg:col-span-7 lg:pr-8 relative z-10">
              <div className="hero-eyebrow">
                <span className="section-eyebrow mb-8 inline-flex">
                  <Sparkle size={12} />
                  Handcrafted greeting cards
                </span>
              </div>

              <h1 className="hero-line-1 trilingual-line-en text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight-display leading-[1.05]">
                Say it with a
              </h1>

              <p lang="ta" className="hero-line-2 trilingual-line-ta text-2xl sm:text-3xl lg:text-4xl mt-2 leading-snug">
                <span className="text-twinkle-rose">ஒரு அழகான</span> அட்டையுடன்
              </p>

              <p lang="si" className="hero-line-3 trilingual-line-si text-2xl sm:text-3xl lg:text-4xl mt-1 leading-snug">
                <span className="text-twinkle-rose">ලස්සන කාඩ්</span> එකකින් කියන්න
              </p>

              <p className="hero-line-4 trilingual-line-en text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight-display leading-[1.05] mt-1">
                <span className="text-twinkle-rose">beautiful card</span>
              </p>

              <TextGenerateEffect
                words="Greeting cards that speak from the heart."
                className="mt-6 font-body"
                duration={0.4}
                filter={false}
              />

              <div className="hero-buttons mt-8 flex flex-col sm:flex-row items-start gap-3">
                <MagneticButton to="/shop" label="Find Your Card" />
                <a
                  href="https://wa.me/947XXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-full border border-twinkle-mist bg-transparent hover:bg-twinkle-mist/20 text-twinkle-ink/70 font-semibold text-sm transition-all active:scale-[0.98] min-h-[44px]"
                >
                  <WhatsappLogo size={18} />
                  Chat with us
                </a>
              </div>

              <div className="hero-stats mt-12 flex items-center gap-6 text-xs text-twinkle-ink/40">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-twinkle-mist" />
                  1,200+ orders delivered
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-twinkle-mist" />
                  65+ unique designs
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-twinkle-mist" />
                  4.9 rating
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-[460px] lg:h-[560px] hidden lg:block">
              <FloatingLetterpressCard
                rotate={6}
                className="floating-card absolute top-2 right-2 w-[260px] h-[340px] z-20"
                title="With Love"
                subtitle="For someone special"
                textColor="text-twinkle-rose"
              />
              <FloatingLetterpressCard
                rotate={-4}
                className="floating-card absolute bottom-4 right-36 w-[240px] h-[310px] z-10"
                title="Happy Birthday"
                subtitle="Celebrate in style"
                textColor="text-twinkle-mist"
              />
              <FloatingLetterpressCard
                rotate={12}
                className="floating-card absolute top-24 right-56 w-[220px] h-[280px] z-0"
                title="Joy & Peace"
                subtitle="Warm wishes"
                textColor="text-twinkle-sage"
              />
            </div>
          </div>
        </div>
      </section>

      <section ref={categoriesRef} className="bg-twinkle-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-eyebrow mb-3">Categories</span>
              <h2 className="section-heading mt-2">Shop by occasion</h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-twinkle-ink hover:text-twinkle-rose transition-colors font-body min-h-[44px]"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="category-item col-span-1">
                <Link
                  to={`/shop?category=${cat.key}`}
                  className={`flex flex-col items-start gap-4 p-5 rounded-2xl border transition-all duration-300 active:scale-[0.97] min-h-[44px] ${
                    cat.key === 'birthday'
                      ? `${cat.bg} ${cat.color} border-twinkle-mist hover:shadow-lg`
                      : 'bg-white border-twinkle-mist hover:bg-twinkle-sage/20 hover:shadow-lg'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-twinkle-mist/20">
                    <cat.icon size={22} className={cat.key === 'birthday' ? cat.color : 'text-twinkle-ink/50'} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${cat.key === 'birthday' ? cat.color : 'text-twinkle-ink/70'}`}>
                      {cat.label}
                    </h3>
                    <p className="text-xs text-twinkle-ink/40 mt-0.5">Browse cards</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:hidden text-center">
            <Link to="/shop" className="text-sm font-semibold text-twinkle-ink hover:text-twinkle-rose transition-colors inline-flex items-center gap-1 font-body min-h-[44px]">
              View all categories <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section ref={featuredRef} className="bg-twinkle-canvas">
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
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-twinkle-ink hover:text-twinkle-rose transition-colors font-body min-h-[44px]"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="featured-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden text-center">
            <Link to="/shop" className="btn-ghost text-sm min-h-[44px]">
              View All Cards
            </Link>
          </div>
        </div>
      </section>

      <section ref={testimonialsRef} className="bg-twinkle-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <span className="section-eyebrow mb-3">Stories</span>
            <h2 className="section-heading mt-2">What our customers say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= testimonial.rating ? 'text-twinkle-rose fill-twinkle-rose' : 'text-twinkle-mist/40'}
                    />
                  ))}
                </div>
                <p className="text-sm text-twinkle-ink/70 leading-relaxed mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-twinkle-mist/40">
                  <div className="w-10 h-10 rounded-full bg-twinkle-rose/15 flex items-center justify-center">
                    <span className="text-sm font-bold text-twinkle-rose">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-twinkle-ink">{testimonial.name}</p>
                    <p className="text-xs text-twinkle-ink/50">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={aboutRef} className="bg-twinkle-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="section-eyebrow mb-3">About</span>
              <h2 className="section-heading mt-2">
                Bringing joy, one card at a time
              </h2>
              <p className="mt-5 text-base text-twinkle-ink/50 leading-relaxed font-body">
                At TwinkleHearts, we believe every occasion deserves to be celebrated with something special. Our beautifully crafted greeting cards are designed to make your loved ones smile.
              </p>
              <p className="mt-4 text-base text-twinkle-ink/50 leading-relaxed font-body">
                Based in Colombo, Sri Lanka, we offer a personal touch with easy ordering via WhatsApp. Browse our collection, choose your favorite cards, and we will handle the rest.
              </p>

              <div className="mt-8 space-y-4">
                <div className="about-item flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-twinkle-sage/20 flex items-center justify-center flex-shrink-0">
                    <Sparkle size={18} className="text-twinkle-sage" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-twinkle-ink">Original designs</h4>
                    <p className="text-sm text-twinkle-ink/70">Handcrafted artwork for every occasion</p>
                  </div>
                </div>
                <div className="about-item flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <WhatsappLogo size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-twinkle-ink">Order via WhatsApp</h4>
                    <p className="text-sm text-twinkle-ink/70">Convenient, personal, and human</p>
                  </div>
                </div>
                <div className="about-item flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-twinkle-rose/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={18} className="text-twinkle-rose" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-twinkle-ink">Delivered with care</h4>
                    <p className="text-sm text-twinkle-ink/70">Fast and reliable delivery across Sri Lanka</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card"><div className="font-mono text-2xl sm:text-3xl font-bold text-twinkle-ink mb-0.5 tracking-tight">1,240</div><div className="text-sm text-twinkle-ink/70">Orders delivered</div></div>
              <div className="stat-card"><div className="font-mono text-2xl sm:text-3xl font-bold text-twinkle-ink mb-0.5 tracking-tight">4.9</div><div className="text-sm text-twinkle-ink/70">Average rating</div></div>
              <div className="stat-card"><div className="font-mono text-2xl sm:text-3xl font-bold text-twinkle-ink mb-0.5 tracking-tight">580+</div><div className="text-sm text-twinkle-ink/70">Happy customers</div></div>
              <div className="stat-card"><div className="font-mono text-2xl sm:text-3xl font-bold text-twinkle-ink mb-0.5 tracking-tight">65</div><div className="text-sm text-twinkle-ink/70">Unique designs</div></div>
            </div>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="bg-twinkle-canvas text-twinkle-ink relative overflow-hidden">
        <SparklesCore
          className="absolute inset-0 z-0"
          particleColor="#d48a7a"
          particleDensity={20}
          minSize={0.5}
          maxSize={1.5}
        />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(166,56,30,0.08), transparent)',
        }} />
        <div className="cta-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center relative z-10">
          <p className="text-xs font-body font-medium tracking-[0.2em] uppercase text-twinkle-rose mb-5">
            Handwritten with care
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight mb-4 text-twinkle-ink">
            Ready to make someone smile?
          </h2>
          <p className="text-base text-twinkle-ink/50 mb-10 max-w-md mx-auto leading-relaxed font-body">
            Browse our collection of greeting cards and find the perfect message for your loved ones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-twinkle-ink text-white hover:bg-twinkle-ink/90 font-semibold text-sm transition-all active:scale-[0.98] shadow-lg shadow-twinkle-ink/10 min-h-[44px]"
            >
              Find Your Card
            </Link>
            <a
              href="https://wa.me/947XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-twinkle-mist/50 hover:border-twinkle-mist hover:bg-twinkle-mist/20 text-twinkle-ink/70 font-medium text-sm transition-all active:scale-[0.98] min-h-[44px]"
            >
              <WhatsappLogo size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="fixed inset-0 z-50 pointer-events-none grain" />
    </div>
  );
}

const cardAccentMap: Record<string, { iconBg: string; footerBg: string }> = {
  'text-twinkle-rose': { iconBg: 'bg-twinkle-rose/20', footerBg: 'bg-twinkle-rose/15' },
  'text-twinkle-mist': { iconBg: 'bg-twinkle-mist/20', footerBg: 'bg-twinkle-mist/15' },
  'text-twinkle-sage': { iconBg: 'bg-twinkle-sage/20', footerBg: 'bg-twinkle-sage/15' },
};

function FloatingLetterpressCard({
  rotate,
  className,
  title,
  subtitle,
  textColor,
}: {
  rotate: number;
  className: string;
  title: string;
  subtitle: string;
  textColor: string;
}) {
  const accent = cardAccentMap[textColor] ?? { iconBg: 'bg-twinkle-rose/20', footerBg: 'bg-twinkle-rose/15' };

  return (
    <div className={className} style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="w-full h-full rounded-[2rem] bg-white border border-twinkle-mist shadow-[0_20px_50px_-12px_rgba(226,232,240,0.3)] flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className={`w-14 h-14 rounded-full ${accent.iconBg} flex items-center justify-center mb-5`}>
            <Heart size={22} className={textColor} />
          </div>
          <p className={`text-center font-display font-semibold text-lg ${textColor} leading-tight`}>
            {title}
          </p>
          <p className="text-center text-sm text-twinkle-ink/50 mt-1.5 font-body">
            {subtitle}
          </p>
        </div>
        <div className={`h-1.5 ${accent.footerBg}`} />
      </div>
    </div>
  );
}

function MagneticButton({ to, label, dark }: { to: string; label: string; dark?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.sqrt((e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2);
    if (dist > 150) {
      gsap.to(ref.current, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
      return;
    }
    const strength = 0.3;
    gsap.to(ref.current, {
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  };

  return (
    <a
      ref={ref}
      href={to}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-full font-semibold text-sm transition-all active:scale-[0.98] min-h-[44px] ${
        dark
          ? 'bg-white text-gray-100 hover:bg-gray-100'
          : 'bg-twinkle-ink hover:bg-twinkle-ink/90 text-white shadow-lg shadow-twinkle-ink/10'
      }`}
    >
      {label}
    </a>
  );
}