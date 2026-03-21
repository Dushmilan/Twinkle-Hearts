import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const total = getTotal();

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link to="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (18%)</span>
                <span className="font-medium">{formatPrice(total * 0.18)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(total * 1.18)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-primary w-full mb-3"
            >
              Proceed to Checkout
            </button>

            <button
              onClick={clearCart}
              className="btn-secondary w-full text-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartItemProps {
  item: any;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  formatPrice: (price: number) => string;
}

function CartItem({ item, onUpdateQuantity, onRemove, formatPrice }: CartItemProps) {
  return (
    <div className="card flex gap-4">
      {/* Product Image */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 mb-1">{item.productName || 'Product'}</h3>
        <p className="text-primary-600 font-semibold mb-2">
          {formatPrice(item.price)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            -
          </button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
          <button
            onClick={() => onRemove(item.productId)}
            className="ml-auto text-red-500 hover:text-red-600 text-sm"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Item Total */}
      <div className="text-right">
        <p className="font-semibold text-gray-900">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}
