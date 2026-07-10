import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: any[];
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatCurrency = (amount: any) => {
    const num = Number(amount);
    return `Rs. ${isNaN(num) ? '0.00' : num.toFixed(2)}`;
  };

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
            <Link
              to="/"
              className="btn-ghost text-sm self-start sm:self-auto"
            >
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
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
            color="bg-blue-500"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-emerald-500"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="bg-twinkle-ink"
          />
          <StatCard
            title="Total Cards"
            value={stats?.totalProducts || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            color="bg-amber-500"
          />
        </div>

        {/* Pending Orders Alert */}
        {stats && stats.pendingOrders > 0 && (
          <div className="bg-white border border-twinkle-mist shadow-sm rounded-xl p-5 mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-twinkle-sky flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-twinkle-ink font-medium">
                  {stats.pendingOrders} order{stats.pendingOrders > 1 ? 's' : ''} pending WhatsApp confirmation
                </p>
                <Link to="/admin/orders" className="text-twinkle-sky hover:text-twinkle-sky/80 underline text-sm">
                  View all pending orders →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/admin/products"
            className="card p-5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-twinkle-blush/20 rounded-xl flex items-center justify-center group-hover:bg-twinkle-blush/30 transition-colors">
                <svg className="w-6 h-6 text-twinkle-blush" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-twinkle-ink">Add New Card</h3>
                <p className="text-sm text-twinkle-ink/50">Create a new greeting card</p>
              </div>
            </div>
          </Link>
          <Link
            to="/admin/orders"
            className="card p-5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-twinkle-sky/20 rounded-xl flex items-center justify-center group-hover:bg-twinkle-sky/30 transition-colors">
                <svg className="w-6 h-6 text-twinkle-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-twinkle-ink">Manage Orders</h3>
                <p className="text-sm text-twinkle-ink/50">View and update orders</p>
              </div>
            </div>
          </Link>
          <Link
            to="/admin/users"
            className="card p-5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-twinkle-mist/20 rounded-xl flex items-center justify-center group-hover:bg-twinkle-mist/30 transition-colors">
                <svg className="w-6 h-6 text-twinkle-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl font-semibold text-twinkle-ink">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-twinkle-ink hover:text-twinkle-blush font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-twinkle-sky/30">
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
              <tbody className="divide-y divide-gray-700">
                {stats?.recentOrders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-twinkle-sky/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-twinkle-ink">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-twinkle-ink/70">
                      {order.user?.name || order.customerName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-twinkle-ink">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${
                        order.status === 'CONFIRMED' ? 'badge-teal' :
                        order.status === 'PENDING_WHATSAPP_CONFIRMATION' ? 'badge-plum' :
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
                {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-twinkle-ink/50">
                      No orders yet
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

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`${color} text-white rounded-xl p-3`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-twinkle-ink/50">{title}</p>
          <p className="text-xl font-bold text-twinkle-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}