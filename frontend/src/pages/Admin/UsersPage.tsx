import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api.js';
import toastService from '../../utils/toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  _count: {
    orders: number;
    addresses: number;
    wishlist: number;
  };
}

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, page]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await api.admin.users.list({ page, limit: 20, search: searchTerm || undefined });
      setUsers((result as any).data.users || []);
      setPagination((result as any).data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      toastService.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    const loadingToast = toastService.loading('Updating user role...');

    try {
      await api.admin.users.updateRole(userId, role);
      toastService.dismiss(loadingToast);
      toastService.success('User role updated');
      fetchUsers();
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to update user role');
    }
  };

  return (
    <div className="min-h-screen bg-twinkle-canvas">
      {/* Header */}
      <header className="bg-twinkle-canvas shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-twinkle-ink">User Management</h1>
              <p className="text-twinkle-ink/60 mt-1">View and manage users</p>
            </div>
            <Link
              to="/admin"
              className="text-twinkle-ink hover:text-twinkle-blush font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-twinkle-mist rounded-lg focus:ring-2 focus:ring-twinkle-blush focus:border-transparent"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-twinkle-sky/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-twinkle-ink/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ruby-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-twinkle-ink/40">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-twinkle-sky/20">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-twinkle-ink/50">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-twinkle-ink/50">
                        {user.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-twinkle-blush ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <option value="CUSTOMER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-twinkle-ink/50">
                        <div className="flex gap-3">
                          <span title="Orders">{user._count.orders} orders</span>
                          <span title="Addresses">{user._count.addresses} addresses</span>
                          <span title="Wishlist">{user._count.wishlist} wishlist</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-twinkle-ink/50">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-twinkle-ink/50">View details</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-twinkle-mist/50 flex justify-between items-center">
              <p className="text-sm text-twinkle-ink/70">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-twinkle-mist rounded-lg text-sm font-medium text-twinkle-ink/70 hover:bg-twinkle-sky/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 border border-twinkle-mist rounded-lg text-sm font-medium text-twinkle-ink/70 hover:bg-twinkle-sky/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <AdminUsers />
    </AdminRoute>
  );
}