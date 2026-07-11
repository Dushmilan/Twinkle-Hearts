import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';
import toastService from '../../utils/toast';
import { formatPrice } from '../../components/UI/Icons';

const STATUS_OPTIONS = [
  { value: 'PENDING_WHATSAPP_CONFIRMATION', label: 'Pending', badge: 'badge-bronze' },
  { value: 'CONFIRMED', label: 'Confirmed', badge: 'badge-teal' },
  { value: 'SHIPPED', label: 'Shipped', badge: 'badge-plum' },
  { value: 'DELIVERED', label: 'Delivered', badge: 'badge-plum' },
  { value: 'CANCELLED', label: 'Cancelled', badge: 'badge-gray' },
];

function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const result = await api.admin.orderDetail(id!);
      setOrder(result.data);
    } catch {
      toastService.error('Failed to load order');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const result = await api.admin.updateOrderStatus(id!, newStatus);
      setOrder(result.data);
      toastService.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch {
      toastService.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-twinkle-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-rose"></div>
      </div>
    );
  }

  if (!order) return null;

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === order.status) || STATUS_OPTIONS[0];

  return (
    <div className="min-h-screen bg-twinkle-canvas">
      <header className="bg-twinkle-canvas shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <Link to="/admin/orders" className="text-twinkle-ink/50 hover:text-twinkle-rose transition-colors">
                  &larr; Orders
                </Link>
                <h1 className="text-3xl font-bold text-twinkle-ink">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <span className={`badge ${currentStatus.badge}`}>{currentStatus.label}</span>
              </div>
              <p className="text-twinkle-ink/60 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-display text-lg font-semibold text-twinkle-ink mb-4">Order Items</h2>
            <div className="divide-y divide-twinkle-mist/50">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link to={`/product/${item.productId}`} className="font-medium text-twinkle-ink hover:text-twinkle-rose transition-colors">
                      {item.productName}
                    </Link>
                    <p className="text-sm text-twinkle-ink/50">Qty: {item.quantity} &times; {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-medium text-twinkle-ink">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-display text-lg font-semibold text-twinkle-ink mb-4">Customer Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">Name</dt>
                <dd className="font-medium text-twinkle-ink">{order.customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">Phone</dt>
                <dd className="font-medium text-twinkle-ink">{order.customerPhone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">Email</dt>
                <dd className="font-medium text-twinkle-ink">{order.user?.email || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right: Order Summary & Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-display text-lg font-semibold text-twinkle-ink mb-4">Order Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">Subtotal</dt>
                <dd className="font-medium text-twinkle-ink">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-twinkle-ink/50">VAT (18%)</dt>
                <dd className="font-medium text-twinkle-ink">{formatPrice(order.tax)}</dd>
              </div>
              <div className="border-t border-twinkle-mist/50 pt-3 flex justify-between">
                <dt className="font-semibold text-twinkle-ink">Total</dt>
                <dd className="font-bold text-lg text-twinkle-rose">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-display text-lg font-semibold text-twinkle-ink mb-4">Update Status</h2>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => {
                const isCurrent = order.status === option.value;
                const isDisabled = updating || isCurrent;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusUpdate(option.value)}
                    disabled={isDisabled}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isCurrent
                        ? 'bg-twinkle-ink text-white cursor-default'
                        : 'bg-twinkle-mist/20 text-twinkle-ink/70 hover:bg-twinkle-rose/20 hover:text-twinkle-rose'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {updating && (
              <div className="flex items-center gap-2 mt-3 text-sm text-twinkle-ink/50">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-twinkle-rose"></div>
                Updating...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <AdminRoute>
      <AdminOrderDetail />
    </AdminRoute>
  );
}
