import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Heart, ShoppingCart, Star, MessageSquare } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import { getImageSrc } from '../../utils/images';
import type { Product, ProductListItem } from '@twinkle-hearts/shared';
import { WhatsAppIcon, formatPrice, CATEGORY_MAP, CATEGORY_BADGE } from '../../components/UI/Icons';
import ProductCard from '../../components/UI/ProductCard';

const WHO_IS_FOR_MAP: Record<string, string[]> = {
  birthday: ["Mom's birthday", "A friend turning 30", "Your child's first birthday", "Grandma's 80th"],
  love: ["Your partner", "A long-distance friend", "Someone you miss", "A first date anniversary"],
  anniversary: ["25th wedding anniversary", "Parents' anniversary", "A milestone year together", "Your best friend's anniversary"],
  friendship: ["A best friend", "A colleague leaving", "A thank-you for being you", "Reconnecting after years"],
  festival: ["Christmas wishes", "New Year blessings", "Diwali greetings", "Eid Mubarak"],
  sympathy: ["A heartfelt condolence", "Thinking of you", "Sending comfort", "A warm embrace from afar"],
  general: ["Just because", "A thinking-of-you moment", "To brighten someone's day", "A simple hello with love"],
};

const MOCK_REVIEWS = [
  { id: '1', name: 'Nipun S.', rating: 5, comment: 'Sent this to my mom on her birthday and she absolutely loved it! The quality is beautiful.', date: '2 weeks ago' },
  { id: '2', name: 'Amara K.', rating: 5, comment: 'Such a meaningful card. The WhatsApp ordering made it so easy.', date: '1 month ago' },
  { id: '3', name: 'David L.', rating: 4, comment: 'Lovely design and fast delivery. Would definitely order again.', date: '3 weeks ago' },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  async function fetchProduct(productId: string) {
    try {
      const data = await api.products.get(productId);
      setProduct(data.product);

      // Fetch related products (same category)
      if (data.product?.category) {
        try {
          const related = await api.products.list({ category: data.product.category, limit: 5 });
          setRelatedProducts((related.products || []).filter((p: ProductListItem) => p.id !== productId).slice(0, 4));
        } catch {
          // silently fail
        }
      }
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

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0 || !reviewComment.trim()) return;
    setReviewSubmitted(true);
    setReviewRating(0);
    setReviewComment('');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  const getCategoryBadge = (category?: string) => {
    const key = category?.toLowerCase() ?? '';
    const label = CATEGORY_MAP[key] || category || 'General';
    const variant = CATEGORY_BADGE[key] || 'badge-plum';
    return <span className={`badge ${variant}`}>{label}</span>;
  };

  const whoIsFor = WHO_IS_FOR_MAP[product?.category?.toLowerCase() ?? ''] || WHO_IS_FOR_MAP.general;

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
                <Heart size={24} />
              </div>
              <h3 className="empty-state-title">Card Not Found</h3>
              <p className="empty-state-text">This card may have been removed. Let's find you another one!</p>
            </div>
            <Link to="/shop" className="btn-primary mt-6">
              Browse Cards
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
        <nav className="flex items-center gap-2 text-sm text-twinkle-ink/70 mb-8" aria-label="Breadcrumb">
          <Link to="/shop" className="hover:text-twinkle-rose transition-colors">Shop</Link>
          <svg className="w-4 h-4 text-twinkle-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-twinkle-ink/70 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image with Zoom */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="aspect-[4/5] bg-twinkle-mist/20 rounded-xl overflow-hidden shadow-lg mb-4 image-zoom-container"
            >
              {images[activeImage] ? (
                <img
                  src={getImageSrc(images[activeImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22 viewBox=%220 0 400 500%22%3E%3Crect fill=%22%23F5E0D3%22 width=%22400%22 height=%22500%22/%3E%3Ctext fill=%22%239BB89B%22 font-family=%22serif%22 font-size=%2224%22 x=%2250%25%22 y=%2245%25%22 text-anchor=%22middle%22%3E%F0%9F%93%8C%3C/text%3E%3Ctext fill=%22%23B04628%22 font-family=%22serif%22 font-size=%2216%22 x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22%3ECard Preview%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-twinkle-mist/20 text-twinkle-ink/40">
                  <span className="text-5xl mb-3">💌</span>
                  <span className="font-display text-lg">Card Preview</span>
                </div>
              )}
            </motion.div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 min-w-[64px] min-h-[64px] ${
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
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl font-bold text-twinkle-ink mb-3"
            >
              {product.name}
            </motion.h1>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex items-baseline gap-2 mb-6"
            >
              <span className="font-body text-3xl font-bold text-twinkle-rose">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-twinkle-ink/50">incl. tax</span>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="prose prose-sm max-w-none mb-6"
            >
              <p className="text-twinkle-ink/70 leading-relaxed">{product.description}</p>
            </motion.div>

            {/* Stock Status */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className={`flex items-center gap-2 mb-6 ${
                product.stock > 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {product.stock > 0
                  ? product.stock <= 3
                    ? `Only ${product.stock} remaining — hurry!`
                    : `In Stock — ${product.stock} available`
                  : 'Currently out of stock'}
              </span>
            </motion.div>

            {/* Who is this for? */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="who-is-for mb-6"
            >
              <p className="who-is-for-title">Perfect for:</p>
              <ul className="who-is-for-list">
                {whoIsFor.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-twinkle-sage" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="mb-6"
              >
                <label className="label-text">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 rounded-lg border border-twinkle-mist flex items-center justify-center hover:bg-twinkle-mist/30 hover:border-twinkle-rose transition-all text-twinkle-ink/50 font-medium min-w-[44px] min-h-[44px]"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-body text-lg font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-11 h-11 rounded-lg border border-twinkle-mist flex items-center justify-center hover:bg-twinkle-mist/30 hover:border-twinkle-rose transition-all text-twinkle-ink/50 font-medium min-w-[44px] min-h-[44px]"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </motion.div>
            )}

            {/* Add to Cart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
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
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
            </motion.div>

            {/* WhatsApp CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <a
                href="https://wa.me/947XXXXXXXX?text=Hi!%20I%20have%20a%20question%20about%20this%20card."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full justify-center mt-3 text-twinkle-ink/50"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Have a question? Chat with us
              </a>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mt-8 pt-8 border-t border-twinkle-mist"
            >
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-twinkle-ink/50">Category</dt>
                  <dd className="font-medium text-twinkle-ink/70 capitalize">{product.category || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-twinkle-ink/50">Delivery</dt>
                  <dd className="font-medium text-emerald-600">Free via WhatsApp delivery</dd>
                </div>
              </dl>
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mt-16 sm:mt-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare size={20} className="text-twinkle-rose" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink">What others say</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="review-card">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= review.rating ? 'text-twinkle-rose fill-twinkle-rose' : 'text-twinkle-mist/40'}
                    />
                  ))}
                </div>
                <p className="text-sm text-twinkle-ink/70 leading-relaxed mb-3">{review.comment}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-twinkle-ink/60">{review.name}</span>
                  <span className="text-xs text-twinkle-ink/40">{review.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Write a Review */}
          <div className="mt-8 card p-6">
            <h3 className="font-display text-lg font-semibold text-twinkle-ink mb-4">Tell us about this card</h3>
            {reviewSubmitted ? (
              <div className="text-center py-4">
                <p className="text-twinkle-sage font-medium">Thank you for your review!</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="label-text">Your rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <Star
                          size={24}
                          className={`transition-colors ${
                            star <= reviewRating ? 'text-twinkle-rose fill-twinkle-rose' : 'text-twinkle-mist/40 hover:text-twinkle-rose/50'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="review-comment" className="label-text">Your review</label>
                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Share your experience with this card..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewRating === 0 || !reviewComment.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </motion.section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="mt-16 sm:mt-24"
          >
            <div className="flex items-center gap-3 mb-8">
              <Heart size={20} className="text-twinkle-rose" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink">Others also browsed</h2>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
            >
              {relatedProducts.map((p) => (
                <motion.div key={p.id} variants={itemVariants}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}
      </div>
    </div>
  );
}