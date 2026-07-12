import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';
import { formatPrice } from '../../components/UI/Icons';
import type { AdminStats } from '@twinkle-hearts/shared';

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const data = await api.admin.stats();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-twinkle-canvas min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-twinkle-mist/20 rounded w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-twinkle-mist/20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-twinkle-ink mb-1">Admin Dashboard</h1>
          <p className="text-twinkle-ink/60">Manage your TwinkleHearts store</p>
        </div>

        <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/admin/products" className="card p-5 hover:shadow-lg transition-all duration-200 group min-h-[44px]">
            <div className="flex items-center gap-4">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-semibold text-twinkle-ink group-hover:text-twinkle-rose transition-colors">
                  Manage Products
                </p>
                <p className="text-sm text-twinkle-ink/50">{stats?.totalProducts || '?'} products</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/orders" className="card p-5 hover:shadow-lg transition-all duration-200 group min-h-[44px]">
            <div className="flex items-center gap-4">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-semibold text-twinkle-ink group-hover:text-twinkle-rose transition-colors">
                  View Orders
                </p>
                <p className="text-sm text-twinkle-ink/50">{stats?.totalOrders || '?'} total orders</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/users" className="card p-5 hover:shadow-lg transition-all duration-200 group min-h-[44px]">
            <div className="flex items-center gap-4">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-semibold text-twinkle-ink group-hover:text-twinkle-rose transition-colors">
                  Manage Users
                </p>
                <p className="text-sm text-twinkle-ink/50">{stats?.totalUsers || '?'} users</p>
              </div>
            </div>
          </Link>
        </div>

        <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-4">At a Glance</h2>
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Orders" value={stats.totalOrders} icon="📬" color="bg-blue-50" />
            <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue)} icon="💰" color="bg-emerald-50" />
            <StatCard title="Total Users" value={stats.totalUsers} icon="👤" color="bg-purple-50" />
          </div>
        )}

        {stats?.recentOrders && stats.recentOrders.length > 0 && (
          <>
            <h2 className="font-display text-xl font-semibold text-twinkle-ink mb-4 mt-8">Recent Orders</h2>
            <div className="sheet overflow-hidden">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="font-medium text-twinkle-ink">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td>{order.user.name}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td className="text-twinkle-ink/50 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to={`/admin/orders/${order.id}`} className="text-twinkle-rose hover:underline text-sm font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`${color} rounded-xl p-3 text-xl`}>
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