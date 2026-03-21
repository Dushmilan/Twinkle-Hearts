import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import CartIcon from '../UI/CartIcon';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const itemCount = useCartStore((state) => state.getItemCount());
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <HeartIcon className="w-8 h-8 text-pink-600" />
              <span className="text-xl font-bold text-gray-900">Twinkle-Hearts</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-pink-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Shop
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/wishlist"
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === '/wishlist'
                        ? 'text-pink-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/orders"
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === '/orders'
                        ? 'text-pink-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Orders
                  </Link>
                </>
              )}

              <Link to="/cart" className="relative">
                <CartIcon className="w-6 h-6 text-gray-600 hover:text-gray-900" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-pink-600 font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Orders
                          </Link>
                          <Link
                            to="/addresses"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Addresses
                          </Link>
                          <Link
                            to="/wishlist"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Wishlist
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link
                              to="/admin"
                              className="block px-4 py-2 text-sm text-pink-600 hover:bg-pink-50"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Admin Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-gray-100 py-2">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">About Twinkle-Hearts</h3>
              <p className="text-sm text-gray-600">
                Beautiful jewelry delivered with love. Order via WhatsApp for a personal touch.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/" className="hover:text-pink-600">Shop All</Link></li>
                <li><Link to="/cart" className="hover:text-pink-600">Cart</Link></li>
                <li><Link to="/orders" className="hover:text-pink-600">Orders</Link></li>
                {isAuthenticated && (
                  <>
                    <li><Link to="/profile" className="hover:text-pink-600">Profile</Link></li>
                    <li><Link to="/addresses" className="hover:text-pink-600">Addresses</Link></li>
                    <li><Link to="/wishlist" className="hover:text-pink-600">Wishlist</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact</h3>
              <p className="text-sm text-gray-600">
                WhatsApp: +91 98765 43210
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Email: hello@twinklehearts.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2026 Twinkle-Hearts. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function OfflineBanner() {
  const isOnline = useCartStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 px-4 py-2 text-center text-sm">
      You're offline. Changes will sync when you're back online.
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
