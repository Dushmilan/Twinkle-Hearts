import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react';
import { api } from '../../api.js';
import { useAuthStore } from '../../store/authStore';
import { OrderSkeleton } from '../../components/UI/LoadingSkeleton';
import { formatPrice } from '../../components/UI/Icons';
import toastService from '../../utils/toast';

interface Order {
  id: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customerName: string;
  createdAt: string;
  status?: string;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  message: string;
}> = {
  PENDING_WHATSAPP_CONFIRMATION: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    message: 'Waiting for WhatsApp confirmation...',
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    message: 'Your gift is being prepared',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    message: 'On its way to bring joy!',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    message: 'Delivered! We hope it brought a smile',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    message: 'This order was cancelled',
  },
  EXPIRED: {
    label: 'Expired',
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    message: 'This order has expired',
  },
};

export default function OrderHistoryPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!listRef.current || orders.length === 0) return;
    const items = listRef.current.querySelectorAll('.order-card');
    gsap.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'power3.out' });
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const data = await api.orders.list();
      setOrders((data.data?.orders || []) as Order[]);
    } catch {
      toastService.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status?: string) => {
    return STATUS_CONFIG[status || ''] || STATUS_CONFIG.PENDING_WHATSAPP_CONFIRMATION;
  };

  const getTimelineSteps = (currentStatus: string) => {
    const allSteps = ['PENDING_WHATSAPP_CONFIRMATION', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentIndex = allSteps.indexOf(currentStatus);
    if (currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
      return [{ status: currentStatus, complete: true, active: true }];
    }
    return allSteps.map((step, index) => ({
      status: step,
      complete: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-6">My Orders</h1>
          <div className="space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-1">My Orders</h1>
        <p className="text-twinkle-ink/60 mb-8 text-sm">Track your meaningful moments</p>

        {orders.length === 0 ? (
          <div className="card">
            <div className="empty-state py-12">
              <div className="empty-state-icon">
                <Package size={24} />
              </div>
              <h3 className="empty-state-title">No orders yet</h3>
              <p className="empty-state-text">Start shopping to see your orders here!</p>
              <Link to="/shop" className="btn-primary mt-6">
                Browse Cards
              </Link>
            </div>
          </div>
        ) : (
          <div ref={listRef} className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const timelineSteps = getTimelineSteps(order.status || 'PENDING_WHATSAPP_CONFIRMATION');

              return (
                <div key={order.id} className="order-card card p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-twinkle-ink">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-twinkle-ink/50">
                        {new Date(order.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor}`}>
                      <StatusIcon size={14} className={statusConfig.color} />
                      <span className={`text-xs font-semibold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className={`${statusConfig.bgColor} rounded-xl p-4 mb-4`}>
                    <p className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.message}
                    </p>
                  </div>

                  {order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && (
                    <div className="flex items-center gap-0 mb-4 px-2">
                      {timelineSteps.map((step, index) => {
                        const stepConfig = getStatusConfig(step.status);
                        const StepIcon = stepConfig.icon;
                        return (
                          <div key={step.status} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                step.complete ? `${stepConfig.bgColor}` : 'bg-twinkle-mist/20'
                              }`}>
                                <StepIcon size={14} className={step.complete ? stepConfig.color : 'text-twinkle-ink/30'} />
                              </div>
                              <span className={`text-[10px] mt-1 font-medium hidden sm:block ${
                                step.active ? stepConfig.color : 'text-twinkle-ink/40'
                              }`}>
                                {stepConfig.label}
                              </span>
                            </div>
                            {index < timelineSteps.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${
                                step.complete ? 'bg-twinkle-sage' : 'bg-twinkle-mist/30'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t border-b border-twinkle-mist py-4 my-4 space-y-3">
                    {order.items.map((item: any, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-twinkle-ink">{item.productName}</p>
                          <p className="text-sm text-twinkle-ink/50">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-twinkle-ink">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-twinkle-ink/50">
                        Total: <span className="text-lg font-bold text-twinkle-rose">{formatPrice(order.total)}</span>
                      </p>
                    </div>
                    <Link
                      to={`/order-success/${order.id}`}
                      className="btn-outline text-sm min-h-[44px]"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}