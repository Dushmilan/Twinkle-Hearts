import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import { HeartIcon, WhatsAppIcon, formatPrice } from '../../components/UI/Icons';

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
    countryCode: '+94',
    customerPhone: '',
  });
  const total = getTotal();
  const taxRate = parseFloat(import.meta.env.VITE_TAX_RATE || '0.18');
  const tax = total * taxRate;
  const finalTotal = total + tax;

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

      const order = await api.orders.create({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: formData.customerName,
        customerPhone: fullPhone,
      });

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
      <div className="bg-twinkle-canvas min-h-screen">
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
      </div>
    );
  }

  return (
    <div className="bg-twinkle-canvas min-h-screen">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-1">
          Checkout
        </h1>
        <p className="text-twinkle-ink/70">
          Just a few more steps to send your cards with love
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-6 flex items-center gap-2">
                <HeartIcon className="w-5 h-5 text-twinkle-blush" />
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
                    <span className="inline-flex items-center px-4 bg-twinkle-mist/20 border border-r-0 border-twinkle-mist rounded-l-lg font-medium text-twinkle-ink/70 text-sm">
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
                  <p className="text-xs text-twinkle-ink/40 mt-2">
                    We'll send your order confirmation to this number via WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary — Gift Receipt */}
          <div className="lg:col-span-2">
            <div className="card rounded-xl border-2 border-dashed border-twinkle-mist p-6 sticky top-24 shadow-lg">
              <div className="text-center mb-6 pb-4 border-b border-twinkle-mist">
                <HeartIcon className="w-8 h-8 text-twinkle-blush mx-auto mb-2" />
                <h2 className="font-display text-xl font-semibold text-twinkle-ink">
                  Your Cards
                </h2>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-twinkle-ink/70 truncate pr-2">
                      {item.productName} <span className="text-twinkle-ink/40">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-twinkle-ink whitespace-nowrap">
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
                  <span className="text-twinkle-ink/50">Tax (18%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-twinkle-mist">
                  <span>Total</span>
                  <span className="text-twinkle-blush">{formatPrice(finalTotal)}</span>
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

              <p className="text-xs text-twinkle-ink/40 text-center mt-3 leading-relaxed">
                You'll be redirected to WhatsApp with a pre-filled order message
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-500 text-red-400 px-5 py-4 rounded-xl">
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
    </div>
  );
}
