import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { HeartIcon, WhatsAppIcon } from '../../components/UI/Icons';
import { getImageSrc } from '../../utils/images';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const total = getTotal();
  const tax = total * 0.18;
  const finalTotal = total + tax;

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
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
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-100 mb-1">
          Your Selection
        </h1>
        <p className="text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''} — pick the perfect cards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-4">
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              formatPrice={formatPrice}
            />
          ))}

          {/* Clear Cart */}
          <div className="flex justify-end pt-2">
            <button
              onClick={clearCart}
              className="text-sm text-gray-400 hover:text-greeting-berry-400 transition-colors font-medium"
            >
              Clear all items
            </button>
          </div>
        </div>

        {/* Order Summary — Gift Receipt Style */}
        <div className="lg:col-span-2">
          <div className="card rounded-xl border-2 border-dashed border-greeting-cocoa-700 p-6 sticky top-24 shadow-lg">
            {/* Gift Receipt Header */}
            <div className="text-center mb-6 pb-4 border-b border-greeting-cocoa-700">
              <HeartIcon className="w-8 h-8 text-greeting-berry-400 mx-auto mb-2" />
              <h2 className="font-display text-xl font-semibold text-gray-100">
                Order Summary
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                A personal touch, delivered
              </p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {item.productName} <span className="text-gray-500">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-100">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-greeting-cocoa-900 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="font-medium text-emerald-400">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax (18%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-greeting-cocoa-900">
                <span className="text-gray-100">Total</span>
                <span className="text-greeting-berry-400">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="btn-whatsapp w-full text-base py-3.5"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Send Order via WhatsApp
            </button>

            <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
              You'll be redirected to WhatsApp with your order details pre-filled
            </p>

            <Link
              to="/"
              className="block text-center text-sm text-greeting-berry-400 hover:text-greeting-berry-300 font-medium mt-4 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
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
        className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg flex-shrink-0 overflow-hidden bg-greeting-charcoal-400"
      >
        {item.image ? (
          <img
            src={getImageSrc(item.image)}
            alt={item.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
            💌
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${item.productId}`}
          className="font-display text-base font-semibold text-gray-100 hover:text-greeting-berry-400 transition-colors truncate block"
        >
          {item.productName || 'Greeting Card'}
        </Link>
        <p className="text-greeting-berry-400 font-bold mt-1">
          {formatPrice(item.price)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 bg-greeting-charcoal-400 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-greeting-cocoa-700 rounded-l-lg transition-colors font-medium"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-greeting-cocoa-700 rounded-r-lg transition-colors font-medium"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            className="ml-auto text-gray-500 hover:text-greeting-berry-400 transition-colors p-1"
            title="Remove item"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Item Total */}
      <div className="text-right hidden sm:block">
        <p className="font-bold text-gray-100 text-lg">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}


