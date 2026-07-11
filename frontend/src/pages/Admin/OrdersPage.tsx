import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';
import toastService from '../../utils/toast';
import { formatPrice } from '../../components/UI/Icons';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'PENDING_WHATSAPP_CONFIRMATION', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING_WHATSAPP_CONFIRMATION: 'badge-bronze',
  CONFIRMED: 'badge-teal',
  SHIPPED: 'badge-plum',
  DELIVERED: 'badge-plum',
  CANCELLED: 'badge-gray',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_WHATSAPP_CONFIRMATION: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const result = await api.admin.orders(page, 20, statusFilter);
      setOrders(result.data.orders || []);
      setPagination(result.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      toastService.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-twinkle-canvas">
      <header className="bg-twinkle-canvas shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-twinkle-ink">Order Management</h1>
              <p className="text-twinkle-ink/60 mt-1">View and manage orders</p>
            </div>
            <Link to="/admin" className="text-twinkle-ink hover:text-twinkle-rose font-medium">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`category-pill whitespace-nowrap ${
                statusFilter === tab.key ? 'category-pill-active' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-twinkle-sage/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-twinkle-rose"></div>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-twinkle-ink/40">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-twinkle-sage/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-twinkle-ink">
                        <Link to={`/admin/orders/${order.id}`} className="hover:text-twinkle-rose transition-colors">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-twinkle-ink">{order.user.name}</div>
                        <div className="text-sm text-twinkle-ink/50">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-twinkle-ink/50">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-twinkle-ink">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${STATUS_BADGE[order.status] || 'badge-gray'}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-twinkle-ink/40">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-twinkle-mist/50 flex justify-between items-center">
              <p className="text-sm text-twinkle-ink/70">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-twinkle-mist rounded-lg text-sm font-medium text-twinkle-ink/70 hover:bg-twinkle-sage/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 border border-twinkle-mist rounded-lg text-sm font-medium text-twinkle-ink/70 hover:bg-twinkle-sage/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminRoute>
      <AdminOrders />
    </AdminRoute>
  );
}
