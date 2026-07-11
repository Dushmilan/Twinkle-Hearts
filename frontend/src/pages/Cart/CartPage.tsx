import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { HeartIcon, WhatsAppIcon, formatPrice } from '../../components/UI/Icons';
import { getImageSrc } from '../../utils/images';

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
  exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const summaryVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4, ease: 'easeOut' as const } },
};

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const total = getTotal();
  const tax = total * 0.18;
  const finalTotal = total + tax;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-twinkle-canvas min-h-screen"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-full h-full" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="16" width="48" height="32" rx="4" />
                <path d="M8 20l24 16 24-16" />
                <path d="M32 32v8" />
                <circle cx="32" cy="44" r="2" fill="currentColor" />
              </svg>
            </div>
            <h3 className="empty-state-title">Your cart is empty</h3>
            <p className="empty-state-text">Start filling it with love — browse our beautiful cards!</p>
            <Link to="/" className="btn-primary mt-6">
              Browse Cards
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-twinkle-canvas min-h-screen"
    >
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-1">
          Your Selection
        </h1>
        <p className="text-twinkle-ink/70">
          {items.length} item{items.length !== 1 ? 's' : ''} — pick the perfect cards
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <CartItem
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  formatPrice={formatPrice}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Clear Cart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end pt-2"
          >
            <button
              onClick={clearCart}
              className="text-sm text-twinkle-ink/50 hover:text-twinkle-rose transition-colors font-medium"
            >
              Clear all items
            </button>
          </motion.div>
        </div>

        {/* Order Summary — Gift Receipt Style */}
        <motion.div
          variants={summaryVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <div className="card rounded-xl border-2 border-dashed border-twinkle-mist p-6 sticky top-24 shadow-lg">
            {/* Gift Receipt Header */}
            <div className="text-center mb-6 pb-4 border-b border-twinkle-mist">
              <HeartIcon className="w-8 h-8 text-twinkle-rose mx-auto mb-2" />
              <h2 className="font-display text-xl font-semibold text-twinkle-ink">
                Order Summary
              </h2>
              <p className="text-xs text-twinkle-ink/40 mt-1">
                A personal touch, delivered
              </p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-twinkle-ink/70">
                    {item.productName} <span className="text-twinkle-ink/40">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-twinkle-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-twinkle-mist pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-twinkle-ink/50">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-twinkle-ink/50">Shipping</span>
                <span className="font-medium text-emerald-400">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-twinkle-ink/50">Tax (18%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-twinkle-mist">
                <span className="text-twinkle-ink">Total</span>
                <span className="text-twinkle-rose">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="btn-whatsapp w-full text-base py-3.5 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <WhatsAppIcon className="w-5 h-5" />
                Send Order via WhatsApp
              </span>
            </button>

            <p className="text-xs text-twinkle-ink/40 text-center mt-3 leading-relaxed">
              You'll be redirected to WhatsApp with your order details pre-filled
            </p>

            <Link
              to="/"
              className="block text-center text-sm text-twinkle-ink hover:text-twinkle-rose font-medium mt-4 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
    </motion.div>
  );
}

import { CartItem as CartItemType } from '../../store/cartStore';

// ---- Cart Item ----

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  formatPrice: (price: number) => string;
}

function CartItem({ item, onUpdateQuantity, onRemove, formatPrice }: CartItemProps) {
  return (
    <div className="card flex gap-4 p-4 group">
      {/* Product Image */}
      <Link
        to={`/product/${item.productId}`}
        className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg flex-shrink-0 overflow-hidden bg-twinkle-mist/20"
      >
        {item.image ? (
          <img
            src={getImageSrc(item.image)}
            alt={item.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-twinkle-ink/40 text-2xl">
            💌
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${item.productId}`}
          className="font-display text-base font-semibold text-twinkle-ink hover:text-twinkle-rose transition-colors truncate block"
        >
          {item.productName || 'Greeting Card'}
        </Link>
        <p className="text-twinkle-rose font-bold mt-1">
          {formatPrice(item.price)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 bg-twinkle-mist/20 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-twinkle-ink/50 hover:text-twinkle-ink hover:bg-twinkle-mist/30 rounded-l-lg transition-colors font-medium active:scale-90"
            >
              −
            </button>
            <motion.span
              key={item.quantity}
              initial={{ scale: 1.3, color: '#d48a7a' }}
              animate={{ scale: 1, color: '#1a202c' }}
              className="w-8 text-center text-sm font-semibold"
            >
              {item.quantity}
            </motion.span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-twinkle-ink/50 hover:text-twinkle-ink hover:bg-twinkle-mist/30 rounded-r-lg transition-colors font-medium active:scale-90"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            className="ml-auto text-twinkle-ink/40 hover:text-twinkle-rose transition-colors p-1 hover:scale-110 transition-all duration-200"
            title="Remove item"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Item Total */}
      <motion.div
        key={item.quantity}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="text-right hidden sm:block"
      >
        <p className="font-bold text-twinkle-ink text-lg">
          {formatPrice(item.price * item.quantity)}
        </p>
      </motion.div>
    </div>
  );
}
