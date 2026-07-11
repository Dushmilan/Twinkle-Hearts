import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Truck, Zap, CheckCircle } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import { WhatsAppIcon, formatPrice } from '../../components/UI/Icons';

const COUNTRY_CODES = [
  { code: '+94', label: 'Sri Lanka', placeholder: '7X XXX XXXX' },
  { code: '+91', label: 'India', placeholder: 'XXXXX XXXXX' },
  { code: '+1', label: 'USA / Canada', placeholder: 'XXX XXX XXXX' },
  { code: '+44', label: 'United Kingdom', placeholder: 'XXXX XXXXXX' },
  { code: '+971', label: 'UAE', placeholder: 'XX XXX XXXX' },
  { code: '+966', label: 'Saudi Arabia', placeholder: 'XX XXX XXXX' },
  { code: '+92', label: 'Pakistan', placeholder: 'XXX XXXXXXX' },
  { code: '+880', label: 'Bangladesh', placeholder: 'XX XXXXXXXX' },
] as const;

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', time: '5–7 business days', price: 'Free', icon: Truck },
  { id: 'rush', label: 'Rush Delivery', time: '1–2 business days', price: '+LKR 500', icon: Zap },
] as const;

type Step = 'shipping' | 'review' | 'confirmation';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    countryCode: '+94',
    customerPhone: '',
    address: '',
    deliverySpeed: 'standard' as 'standard' | 'rush',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const total = getTotal();
  const taxRate = parseFloat(import.meta.env.VITE_TAX_RATE || '0.18');
  const tax = total * taxRate;
  const deliveryFee = formData.deliverySpeed === 'rush' ? 500 : 0;
  const finalTotal = total + tax + deliveryFee;

  const validate = (field?: string) => {
    const newErrors: Record<string, string> = {};

    if (!field || field === 'customerName') {
      if (!formData.customerName.trim()) {
        newErrors.customerName = 'Name is required';
      }
    }

    if (!field || field === 'customerPhone') {
      const fullPhone = `${formData.countryCode}${formData.customerPhone.replace(/\s/g, '')}`;
      if (!formData.customerPhone) {
        newErrors.customerPhone = 'Phone number is required';
      } else if (!/^\+?[0-9]{10,15}$/.test(fullPhone)) {
        newErrors.customerPhone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validate(field);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ customerName: true, customerPhone: true });
    if (validate()) {
      setCurrentStep('review');
    }
  };

  const handleConfirmOrder = async () => {
    if (isSubmitting) return;

    setLoading(true);
    setError(null);
    setIsSubmitting(true);

    try {
      const fullPhone = `${formData.countryCode}${formData.customerPhone.replace(/\s/g, '')}`;

      const order = await api.orders.create({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: formData.customerName,
        customerPhone: fullPhone,
      });

      clearCart();
      window.open(order.whatsappDeepLink, '_blank');
      navigate(`/order-success/${order.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === formData.countryCode);

  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'shipping', label: 'Shipping', number: 1 },
    { key: 'review', label: 'Review', number: 2 },
    { key: 'confirmation', label: 'Confirm', number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Heart size={24} />
            </div>
            <h3 className="empty-state-title">Nothing to checkout yet</h3>
            <p className="empty-state-text">Add some cards to your cart first!</p>
            <button onClick={() => navigate('/shop')} className="btn-primary mt-6">
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
          <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-1">Checkout</h1>
          <p className="text-twinkle-ink/70">Just a few more steps to send your cards with love</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-0 max-w-lg mx-auto">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`progress-step-dot ${
                      index < currentStepIndex
                        ? 'progress-step-dot-complete'
                        : index === currentStepIndex
                        ? 'progress-step-dot-active'
                        : 'progress-step-dot-inactive'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle size={16} />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      index <= currentStepIndex ? 'text-twinkle-ink' : 'text-twinkle-ink/40'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`progress-step-line mx-2 ${
                      index < currentStepIndex ? 'progress-step-line-complete' : ''
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleShippingSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {currentStep === 'shipping' && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="card p-6">
                      <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-6 flex items-center gap-2">
                        <Heart size={18} className="text-twinkle-rose" />
                        Your Details
                      </h2>

                      <div className="space-y-5">
                        {/* Full Name */}
                        <div>
                          <label htmlFor="customerName" className="label-text">Full Name *</label>
                          <input
                            id="customerName"
                            type="text"
                            required
                            value={formData.customerName}
                            onChange={(e) => handleChange('customerName', e.target.value)}
                            onBlur={() => handleBlur('customerName')}
                            className={`input-field ${errors.customerName && touched.customerName ? 'input-field-error' : ''}`}
                            placeholder="Enter your full name"
                          />
                          {errors.customerName && touched.customerName && (
                            <p className="error-text">{errors.customerName}</p>
                          )}
                        </div>

                        {/* Country */}
                        <div>
                          <label htmlFor="countryCode" className="label-text">Country *</label>
                          <select
                            id="countryCode"
                            value={formData.countryCode}
                            onChange={(e) => handleChange('countryCode', e.target.value)}
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
                          <label htmlFor="customerPhone" className="label-text">WhatsApp Number *</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-4 bg-twinkle-mist/20 border border-r-0 border-twinkle-mist rounded-l-lg font-medium text-twinkle-ink/70 text-sm min-h-[44px]">
                              {formData.countryCode}
                            </span>
                            <input
                              id="customerPhone"
                              type="tel"
                              required
                              value={formData.customerPhone}
                              onChange={(e) => handleChange('customerPhone', e.target.value)}
                              onBlur={() => handleBlur('customerPhone')}
                              className={`input-field rounded-l-none flex-1 ${errors.customerPhone && touched.customerPhone ? 'input-field-error' : ''}`}
                              placeholder={selectedCountry?.placeholder || 'Phone number'}
                              pattern="[0-9\s]+"
                            />
                          </div>
                          {errors.customerPhone && touched.customerPhone && (
                            <p className="error-text">{errors.customerPhone}</p>
                          )}
                          <p className="helper-text">
                            We'll send your order confirmation to this number via WhatsApp
                          </p>
                        </div>

                        {/* Address (Optional) */}
                        <div>
                          <label htmlFor="address" className="label-text">Delivery Address (Optional)</label>
                          <textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="input-field min-h-[80px] resize-none"
                            placeholder="Street address, city..."
                          />
                        </div>

                        {/* Delivery Speed */}
                        <div>
                          <label className="label-text">Delivery Speed</label>
                          <div className="space-y-3">
                            {DELIVERY_OPTIONS.map((option) => (
                              <label
                                key={option.id}
                                className={`delivery-option ${
                                  formData.deliverySpeed === option.id ? 'delivery-option-selected' : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="deliverySpeed"
                                  value={option.id}
                                  checked={formData.deliverySpeed === option.id}
                                  onChange={(e) => handleChange('deliverySpeed', e.target.value)}
                                  className="sr-only"
                                />
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.deliverySpeed === option.id ? 'bg-twinkle-rose/15' : 'bg-twinkle-mist/20'
                                }`}>
                                  <option.icon size={18} className={formData.deliverySpeed === option.id ? 'text-twinkle-rose' : 'text-twinkle-ink/40'} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-twinkle-ink">{option.label}</p>
                                  <p className="text-xs text-twinkle-ink/50">{option.time}</p>
                                </div>
                                <span className={`font-medium text-sm ${option.id === 'rush' ? 'text-twinkle-rose' : 'text-emerald-600'}`}>
                                  {option.price}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Button */}
                    <div className="mt-6">
                      <button
                        type="submit"
                        className="btn-primary w-full py-3.5 text-base"
                      >
                        Continue to Review
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="card p-6">
                      <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-6 flex items-center gap-2">
                        <CheckCircle size={18} className="text-twinkle-sage" />
                        Review Your Order
                      </h2>

                      {/* Shipping Info */}
                      <div className="mb-6 pb-6 border-b border-twinkle-mist">
                        <p className="text-xs text-twinkle-ink/50 uppercase tracking-wider mb-2">Shipping to</p>
                        <p className="font-medium text-twinkle-ink">{formData.customerName}</p>
                        <p className="text-sm text-twinkle-ink/60">{formData.countryCode} {formData.customerPhone}</p>
                        {formData.address && (
                          <p className="text-sm text-twinkle-ink/60 mt-1">{formData.address}</p>
                        )}
                        <p className="text-sm text-twinkle-ink/60 mt-1">
                          {DELIVERY_OPTIONS.find((o) => o.id === formData.deliverySpeed)?.label} — {DELIVERY_OPTIONS.find((o) => o.id === formData.deliverySpeed)?.time}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCurrentStep('shipping')}
                          className="text-xs text-twinkle-rose hover:underline mt-2"
                        >
                          Edit details
                        </button>
                      </div>

                      {/* Items */}
                      <div className="space-y-3 mb-4">
                        {items.map((item) => (
                          <div key={item.productId} className="flex justify-between text-sm">
                            <span className="text-twinkle-ink/70 truncate pr-2">
                              {item.productName} <span className="text-twinkle-ink/40">x{item.quantity}</span>
                            </span>
                            <span className="font-medium text-twinkle-ink whitespace-nowrap">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-twinkle-mist pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-twinkle-ink/50">Subtotal</span>
                          <span className="font-medium">{formatPrice(total)}</span>
                        </div>
                        {deliveryFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-twinkle-ink/50">Rush Delivery</span>
                            <span className="font-medium">{formatPrice(deliveryFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-twinkle-ink/50">Tax (18% VAT)</span>
                          <span className="font-medium">{formatPrice(tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-twinkle-mist">
                          <span>Total</span>
                          <span className="text-twinkle-rose">{formatPrice(finalTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('shipping')}
                        className="btn-outline flex-1"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmOrder}
                        disabled={loading}
                        className="btn-whatsapp flex-1 text-base py-3.5 disabled:opacity-60"
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
                            Send Order via WhatsApp
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-2">
              <div className="card rounded-xl border-2 border-dashed border-twinkle-mist p-6 sticky top-24 shadow-lg">
                <div className="text-center mb-6 pb-4 border-b border-twinkle-mist">
                  <Heart size={20} className="text-twinkle-rose mx-auto mb-2" />
                  <h2 className="font-display text-lg font-semibold text-twinkle-ink">Your Cards</h2>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-twinkle-ink/70 truncate pr-2">
                        {item.productName} <span className="text-twinkle-ink/40">x{item.quantity}</span>
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
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-twinkle-ink/50">Rush Delivery</span>
                      <span className="font-medium">{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-twinkle-ink/50">Tax (18%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-twinkle-mist">
                    <span>Total</span>
                    <span className="text-twinkle-rose">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}