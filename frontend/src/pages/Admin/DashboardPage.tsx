import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';
import { formatPrice } from '../../components/UI/Icons';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: any[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING_WHATSAPP_CONFIRMATION', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.admin.stats();
        setStats(result.data as DashboardStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const filteredOrders = stats?.recentOrders?.filter((order: any) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-twinkle-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-twinkle-ink border-t-transparent rounded-full mx-auto" />
          <p className="text-twinkle-ink/50 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-twinkle-canvas">
      {/* Admin Header */}
      <header className="card border-b border-twinkle-mist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-twinkle-ink">Admin Dashboard</h1>
              <p className="text-twinkle-ink/50 mt-1">Manage your TwinkleHearts store</p>
            </div>
            <Link to="/" className="btn-ghost text-sm self-start sm:self-auto min-h-[44px]">
              ← Back to Store
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon="📦"
            color="bg-twinkle-rose/15 text-twinkle-rose"
          />
          <StatCard
            title="Total Revenue"
            value={formatPrice(stats?.totalRevenue || 0)}
            icon="💰"
            color="bg-twinkle-sage/15 text-twinkle-sage"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            color="bg-twinkle-mist/30 text-twinkle-ink/60"
          />
          <StatCard
            title="Total Cards"
            value={stats?.totalProducts || 0}
            icon="💌"
            color="bg-twinkle-rose/10 text-twinkle-rose"
          />
        </div>

        {/* Pending Orders Alert */}
        {stats && stats.pendingOrders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-amber-800 font-medium">
                  {stats.pendingOrders} order{stats.pendingOrders > 1 ? 's' : ''} pending WhatsApp confirmation
                </p>
                <Link to="/admin/orders" className="text-amber-700 hover:text-amber-800 underline text-sm">
                  View all pending orders →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/admin/products" className="card p-5 hover:shadow-lg transition-all duration-200 group min-h-[44px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-twinkle-rose/15 rounded-xl flex items-center justify-center group-hover:bg-twinkle-rose/25 transition-colors">
                <span className="text-xl">➕</span>
              </div>
              <div>
                <h3 className="font-semibold text-twinkle-ink">Add New Card</h3>
                <p className="text-sm text-twinkle-ink/50">Create a new greeting card</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/orders" className="card p-5 hover:shadow-lg transition-all duration-200 group min-h-[44px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-twinkle-sage/15 rounded-xl flex items-center justify-center group-hover:bg-twinkle-sage/25 transition-colors">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h3 className="font-semibold text-twinkle-ink">Manage Orders</h3>
                <p className="text-sm text-twinkle-ink/50">View and update orders</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/users" className="card p-5 hover:shadow-lg transition-all duration-200 group min-h-[44px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-twinkle-mist/20 rounded-xl flex items-center justify-center group-hover:bg-twinkle-mist/30 transition-colors">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h3 className="font-semibold text-twinkle-ink">Manage Users</h3>
                <p className="text-sm text-twinkle-ink/50">View and edit users</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="font-display text-xl font-semibold text-twinkle-ink">Recent Orders</h2>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field py-2 px-3 text-sm min-h-[44px]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Link to="/admin/orders" className="text-sm text-twinkle-ink hover:text-twinkle-rose font-medium min-h-[44px] flex items-center">
                View All →
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-twinkle-mist">
              <thead className="bg-twinkle-canvas">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-twinkle-mist">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-twinkle-sage/10 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-twinkle-ink">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-twinkle-ink/70">
                      {order.user?.name || order.customerName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-twinkle-ink">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${
                        order.status === 'CONFIRMED' ? 'badge-teal' :
                        order.status === 'PENDING_WHATSAPP_CONFIRMATION' ? 'badge-plum' :
                        order.status === 'SHIPPED' ? 'badge-lilac' :
                        order.status === 'DELIVERED' ? 'badge-teal' :
                        'badge-bronze'
                      }`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-twinkle-ink/50">
                      {new Date(order.createdAt).toLocaleDateString('en-LK')}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-twinkle-ink/50">
                      No orders match this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-center gap-4">
        <div className={`${color} rounded-xl p-3 text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-twinkle-ink/50">{title}</p>
          <p className="text-xl font-bold text-twinkle-ink">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}