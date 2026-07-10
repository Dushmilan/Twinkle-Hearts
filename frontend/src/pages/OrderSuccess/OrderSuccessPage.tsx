import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  async function fetchOrder(id: string) {
    try {
      const data = await api.orders.get(id);
      setOrder(data.order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-greeting-charcoal-400 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-greeting-charcoal-400 rounded w-48 mx-auto mb-2" />
            <div className="h-4 bg-greeting-charcoal-400 rounded w-64 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-heart-pop">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-100 mb-2">
          Order Placed! 🎉
        </h1>
        <p className="text-gray-400 text-lg">
          Your cards are on their way — check WhatsApp to confirm
        </p>
      </div>

      {order && (
        <div className="card p-6 mb-8">
          {/* Receipt Header */}
          <div className="text-center mb-6 pb-4 border-b border-greeting-cocoa-700">
            <HeartIcon className="w-8 h-8 text-greeting-berry-400 mx-auto mb-2" />
            <h2 className="font-display text-xl font-semibold text-gray-100">
              Order Summary
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Customer</span>
              <span className="font-medium text-gray-100">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Phone</span>
              <span className="font-medium text-gray-100">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total</span>
              <span className="font-bold text-lg text-greeting-berry-400">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-greeting-charcoal-500 border border-greeting-cocoa-700 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-greeting-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-100 mb-1">Next Step</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Open WhatsApp and send the pre-filled order message. We'll confirm your order and arrange delivery!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link to="/" className="btn-primary">
          Continue Shopping
        </Link>
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
