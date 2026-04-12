import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

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
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
          Your Selection
        </h1>
        <p className="text-gray-500">
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
              className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
            >
              Clear all items
            </button>
          </div>
        </div>

        {/* Order Summary — Gift Receipt Style */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-card border-2 border-dashed border-cream-200 p-6 sticky top-24 shadow-soft">
            {/* Gift Receipt Header */}
            <div className="text-center mb-6 pb-4 border-b border-cream-100">
              <HeartIcon className="w-8 h-8 text-coral-400 mx-auto mb-2" />
              <h2 className="font-display text-xl font-semibold text-gray-900">
                Order Summary
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                A personal touch, delivered
              </p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.productName} <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-cream-200 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-sage-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (18%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-cream-100">
                <span className="text-gray-900">Total</span>
                <span className="text-coral-600">{formatPrice(finalTotal)}</span>
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

            <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
              You'll be redirected to WhatsApp with your order details pre-filled
            </p>

            <Link
              to="/"
              className="block text-center text-sm text-coral-600 hover:text-coral-700 font-medium mt-4 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Cart Item ----

interface CartItemProps {
  item: any;
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
        className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg flex-shrink-0 overflow-hidden bg-cream-100"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-300 text-2xl">
            💌
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${item.productId}`}
          className="font-display text-base font-semibold text-gray-900 hover:text-coral-600 transition-colors truncate block"
        >
          {item.productName || 'Greeting Card'}
        </Link>
        <p className="text-coral-600 font-bold mt-1">
          {formatPrice(item.price)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 bg-cream-100 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-cream-200 rounded-l-lg transition-colors font-medium"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-cream-200 rounded-r-lg transition-colors font-medium"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            className="ml-auto text-gray-400 hover:text-red-500 transition-colors p-1"
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
        <p className="font-bold text-gray-900 text-lg">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
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
