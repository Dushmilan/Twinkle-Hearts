import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
  });

  const total = getTotal();
  const tax = total * 0.18;
  const finalTotal = total + tax;

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const order = await response.json();

      // Clear cart and redirect to WhatsApp
      clearCart();

      // Open WhatsApp with pre-filled message
      window.open(order.whatsappDeepLink, '_blank');

      // Redirect to success page
      navigate(`/order-success/${order.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cart is Empty</h1>
          <p className="text-gray-500 mb-4">Add items to your cart before checkout</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        {/* Customer Information */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                className="input-field"
                placeholder="Enter your WhatsApp number"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send your order details to this number via WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.productName} x {item.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (18%)</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-lg flex items-center justify-center"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              <WhatsAppIcon className="w-5 h-5 mr-2" />
              Confirm & Send via WhatsApp
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          By confirming, you'll be redirected to WhatsApp to send your order details.
          We'll respond with confirmation shortly.
        </p>
      </form>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}
