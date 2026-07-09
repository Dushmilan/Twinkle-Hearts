import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuthStore } from '../../store/authStore';
import { OrderSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';

interface Order {
  id: string;
  items: Array<unknown>;
  total: number;
  customerName: string;
  createdAt: string;
  status?: string;
}

export default function OrderHistoryPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const data = await api.orders.list();
      setOrders(data.data?.orders || []);
    } catch (error) {
      toastService.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: any) => {
    const num = Number(amount);
    return `Rs. ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusMap: Record<string, { label: string; variant: string }> = {
      PENDING_WHATSAPP_CONFIRMATION: { label: 'Pending', variant: 'badge-gold' },
      CONFIRMED: { label: 'Confirmed', variant: 'badge-sage' },
      CANCELLED: { label: 'Cancelled', variant: 'badge-rose' },
      EXPIRED: { label: 'Expired', variant: 'badge-coral' },
    };
    const s = statusMap[status] || { label: status, variant: 'badge-coral' };
    return <span className={`badge ${s.variant}`}>{s.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-4">
          <OrderSkeleton />
          <OrderSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">My Orders</h1>
      <p className="text-gray-500 mb-8">Track your card orders</p>

      {orders.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <svg className="w-full h-full" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="16" width="48" height="32" rx="4" />
                <path d="M8 20l24 16 24-16" />
              </svg>
            </div>
            <h3 className="empty-state-title">No orders yet</h3>
            <p className="empty-state-text">Start shopping to see your orders here!</p>
            <Link to="/" className="btn-primary mt-6">
              Browse Cards
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="border-t border-b border-neutral-100 py-4 my-4 space-y-3">
                {order.items.map((item: any, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    Total: <span className="text-lg font-bold text-coral-600">{formatCurrency(order.total)}</span>
                  </p>
                </div>
                <Link
                  to={`/order-success/${order.id}`}
                  className="btn-secondary text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
