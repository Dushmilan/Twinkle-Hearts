import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

// Country codes for phone input
const COUNTRY_CODES = [
  { code: '+94', label: '🇱🇰 Sri Lanka', placeholder: '7X XXX XXXX' },
  { code: '+91', label: '🇮🇳 India', placeholder: 'XXXXX XXXXX' },
  { code: '+1', label: '🇺🇸 USA / Canada', placeholder: 'XXX XXX XXXX' },
  { code: '+44', label: '🇬🇧 United Kingdom', placeholder: 'XXXX XXXXXX' },
  { code: '+971', label: '🇦🇪 UAE', placeholder: 'XX XXX XXXX' },
  { code: '+966', label: '🇸🇦 Saudi Arabia', placeholder: 'XX XXX XXXX' },
  { code: '+92', label: '🇵🇰 Pakistan', placeholder: 'XXX XXXXXXX' },
  { code: '+880', label: '🇧🇩 Bangladesh', placeholder: 'XX XXXXXXXX' },
] as const;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // C8: Prevent double submission

  const [formData, setFormData] = useState({
    customerName: '',
    countryCode: '+94', // Default to Sri Lanka
    customerPhone: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const total = getTotal();
  const taxRate = parseFloat(import.meta.env.VITE_TAX_RATE || '0.18');
  const tax = total * taxRate;
  const finalTotal = total + tax;

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // C8: Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setLoading(true);
    setError(null);
    setIsSubmitting(true);

    try {
      const fullPhone = `${formData.countryCode}${formData.customerPhone.replace(/\s/g, '')}`;

      // M11: Validate phone number format
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(fullPhone)) {
        throw new Error('Invalid phone number format');
      }

      const response = await fetch(`${API_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customerName: formData.customerName,
          customerPhone: fullPhone,
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
      setIsSubmitting(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.countryCode);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="empty-state">
          <div className="empty-state-icon">
            <WhatsAppIcon className="w-full h-full" />
          </div>
          <h3 className="empty-state-title">Nothing to checkout</h3>
          <p className="empty-state-text">Add some cards to your cart first!</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6">
            Browse Cards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
          Checkout
        </h1>
        <p className="text-gray-500">
          Just a few more steps to send your cards with love
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <HeartIcon className="w-5 h-5 text-coral-400" />
                Your Details
              </h2>

              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="label-text">Full Name *</label>
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

                {/* Country */}
                <div>
                  <label className="label-text">Country *</label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value, customerPhone: '' })
                    }
                    className="input-field"
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="label-text">WhatsApp Number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 bg-cream-100 border border-r-0 border-gray-200 rounded-l-lg font-medium text-gray-700 text-sm">
                      {formData.countryCode}
                    </span>
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      className="input-field rounded-l-none flex-1"
                      placeholder={selectedCountry?.placeholder || 'Phone number'}
                      pattern="[0-9\s]+"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    We'll send your order confirmation to this number via WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary — Gift Receipt */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-card border-2 border-dashed border-cream-200 p-6 sticky top-24 shadow-soft">
              <div className="text-center mb-6 pb-4 border-b border-cream-100">
                <HeartIcon className="w-8 h-8 text-coral-400 mx-auto mb-2" />
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Your Cards
                </h2>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">
                      {item.productName} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 whitespace-nowrap">
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
                  <span className="text-gray-500">Tax (18%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-cream-100">
                  <span>Total</span>
                  <span className="text-coral-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-whatsapp w-full text-base py-3.5 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-5 h-5" />
                    Confirm & Send via WhatsApp
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                You'll be redirected to WhatsApp with a pre-filled order message
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-card">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </form>
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
