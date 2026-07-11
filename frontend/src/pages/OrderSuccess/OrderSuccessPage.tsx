import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HeartIcon, formatPrice } from '../../components/UI/Icons';

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

  if (loading) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-twinkle-mist/20 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-twinkle-mist/20 rounded w-48 mx-auto mb-2" />
            <div className="h-4 bg-twinkle-mist/20 rounded w-64 mx-auto" />
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="bg-twinkle-canvas min-h-screen">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-heart-pop">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-2">
          Order Placed! 🎉
        </h1>
        <p className="text-twinkle-ink/70 text-lg">
          Your cards are on their way — check WhatsApp to confirm
        </p>
      </div>

      {order && (
        <div className="card p-6 mb-8">
          {/* Receipt Header */}
          <div className="text-center mb-6 pb-4 border-b border-twinkle-mist">
            <HeartIcon className="w-8 h-8 text-twinkle-rose mx-auto mb-2" />
            <h2 className="font-display text-xl font-semibold text-twinkle-ink">
              Order Summary
            </h2>
            <p className="text-xs text-twinkle-ink/40 mt-1">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-twinkle-ink/50">Customer</span>
              <span className="font-medium text-twinkle-ink">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-twinkle-ink/50">Phone</span>
              <span className="font-medium text-twinkle-ink">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-twinkle-ink/50">Total</span>
              <span className="font-bold text-lg text-twinkle-rose">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-twinkle-sage/20 border border-twinkle-mist rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-twinkle-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-twinkle-ink mb-1">Next Step</p>
                <p className="text-sm text-twinkle-ink/50 leading-relaxed">
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
    </div>
  );
}


