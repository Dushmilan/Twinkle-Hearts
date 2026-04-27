import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import CartIcon from '../UI/CartIcon';
import { HeartIcon } from '../UI/Icons';
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
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <HeartIcon className="w-7 h-7 text-coral-500 group-hover:animate-heart-pop transition-transform" />
              <span className="text-xl font-display font-semibold text-gray-900 tracking-tight">
                Twinkle<span className="text-coral-500">Hearts</span>
              </span>
            </Link>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/shop" active={location.pathname === '/shop'}>
                Shop
              </NavLink>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <CartIcon className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-coral-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-heart-pop">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-coral-100 rounded-full flex items-center justify-center">
                      <span className="text-coral-600 font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-card shadow-card z-20 border border-cream-200 overflow-hidden animate-fade-up">
                        <div className="px-4 py-3 border-b border-cream-100">
                          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-2">
                          <DropdownLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                            Profile
                          </DropdownLink>
                          <DropdownLink to="/orders" onClick={() => setIsMenuOpen(false)}>
                            Orders
                          </DropdownLink>
                          <DropdownLink to="/addresses" onClick={() => setIsMenuOpen(false)}>
                            Addresses
                          </DropdownLink>
                          <DropdownLink to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                            Wishlist
                          </DropdownLink>
                          {user?.role === 'ADMIN' && (
                            <>
                              <div className="my-2 border-t border-cream-100" />
                              <DropdownLink to="/admin" onClick={() => setIsMenuOpen(false)} highlight>
                                Admin Dashboard
                              </DropdownLink>
                            </>
                          )}
                        </div>
                        <div className="border-t border-cream-100 py-2">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm py-2 px-5"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-cream-100 py-4 animate-fade-up">
              <nav className="flex flex-col gap-1">
                <NavLink to="/shop" active={location.pathname === '/shop'} mobile onClick={() => setIsMenuOpen(false)}>
                  Shop
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to="/profile" active={location.pathname === '/profile'} mobile onClick={() => setIsMenuOpen(false)}>
                      Profile
                    </NavLink>
                    <NavLink to="/addresses" active={location.pathname === '/addresses'} mobile onClick={() => setIsMenuOpen(false)}>
                      Addresses
                    </NavLink>
                    {user?.role === 'ADMIN' && (
                      <NavLink to="/admin" active={location.pathname.startsWith('/admin')} mobile highlight onClick={() => setIsMenuOpen(false)}>
                        Admin Dashboard
                      </NavLink>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" active={location.pathname === '/login'} mobile onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </NavLink>
                    <div className="px-4 pt-2">
                      <Link to="/register" className="btn-primary w-full justify-center" onClick={() => setIsMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </div>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-cream-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <HeartIcon className="w-6 h-6 text-coral-500" />
                <span className="text-lg font-display font-semibold text-gray-900">
                  Twinkle<span className="text-coral-500">Hearts</span>
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Beautiful greeting cards delivered with love. Order via WhatsApp for a personal touch.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Shop</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-600 hover:text-coral-600 transition-colors">All Cards</Link></li>
                <li><Link to="/?category=birthday" className="text-gray-600 hover:text-coral-600 transition-colors">Birthday</Link></li>
                <li><Link to="/?category=love" className="text-gray-600 hover:text-coral-600 transition-colors">Love & Romance</Link></li>
                <li><Link to="/?category=anniversary" className="text-gray-600 hover:text-coral-600 transition-colors">Anniversary</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/cart" className="text-gray-600 hover:text-coral-600 transition-colors">Cart</Link></li>
                {isAuthenticated ? (
                  <>
                    <li><Link to="/orders" className="text-gray-600 hover:text-coral-600 transition-colors">My Orders</Link></li>
                    <li><Link to="/wishlist" className="text-gray-600 hover:text-coral-600 transition-colors">Wishlist</Link></li>
                    <li><Link to="/profile" className="text-gray-600 hover:text-coral-600 transition-colors">Profile</Link></li>
                  </>
                ) : (
                  <li><Link to="/login" className="text-gray-600 hover:text-coral-600 transition-colors">Sign In</Link></li>
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="https://wa.me/947XXXXXXXX" target="_blank" rel="noopener noreferrer" className="hover:text-whatsapp transition-colors">
                    WhatsApp: +94 7X XXX XXXX
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@twinklehearts.lk" className="hover:text-coral-600 transition-colors">
                    hello@twinklehearts.lk
                  </a>
                </li>
                <li className="text-sm text-gray-500 pt-1">
                  Sri Lanka 🇱🇰
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-cream-200 text-center text-sm text-gray-500">
            © 2026 TwinkleHearts. Made with <HeartIcon className="w-3.5 h-3.5 text-coral-400 inline-block" /> in Sri Lanka.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- Sub-components ----

function NavLink({
  to,
  active,
  mobile,
  highlight,
  onClick,
  children,
}: {
  to: string;
  active: boolean;
  mobile?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const base = mobile
    ? 'px-4 py-2.5 text-sm font-medium rounded-lg transition-colors'
    : 'px-3 py-2 text-sm font-medium rounded-pill transition-all duration-200';

  const activeClass = highlight
    ? mobile
      ? 'text-coral-600 bg-coral-50'
      : 'text-coral-600 bg-coral-50'
    : mobile
    ? active
      ? 'text-coral-600 bg-coral-50'
      : 'text-gray-600 hover:text-gray-900 hover:bg-cream-100'
    : active
    ? 'text-coral-600 bg-coral-50'
    : 'text-gray-600 hover:text-gray-900';

  return (
    <Link
      to={to}
      className={`${base} ${activeClass}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  to,
  onClick,
  highlight,
  children,
}: {
  to: string;
  onClick?: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-2 text-sm transition-colors ${
        highlight
          ? 'text-coral-600 hover:bg-coral-50 font-medium'
          : 'text-gray-700 hover:bg-cream-100'
      }`}
    >
      {children}
    </Link>
  );
}

function OfflineBanner() {
  const isOnline = useCartStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <div className="bg-gold-300 text-gold-800 px-4 py-2 text-center text-sm font-body animate-fade-up">
      You're offline. Your changes will sync when you're back online.
    </div>
  );
}


