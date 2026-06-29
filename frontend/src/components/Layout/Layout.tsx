import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  User,
  Package,
  MapPin,
  SignOut,
  List,
  X,
  CaretDown,
  HeartStraight,
} from '@phosphor-icons/react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
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
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <OfflineBanner />

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <Heart size={24} weight="fill" className="text-coral-500 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-display font-semibold text-zinc-900 tracking-tight">
                Twinkle<span className="text-coral-500">Hearts</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/shop" active={location.pathname === '/shop'}>
                Shop
              </NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/cart" className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-coral-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-coral-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-coral-600" />
                    </div>
                    <CaretDown
                      size={12}
                      className={`text-zinc-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200/50 z-20 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-zinc-100">
                            <p className="text-sm font-semibold text-zinc-900">{user?.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                          </div>
                          <div className="py-2">
                            <DropdownLink to="/profile" icon={User} onClick={() => setIsMenuOpen(false)}>
                              Profile
                            </DropdownLink>
                            <DropdownLink to="/orders" icon={Package} onClick={() => setIsMenuOpen(false)}>
                              Orders
                            </DropdownLink>
                            <DropdownLink to="/addresses" icon={MapPin} onClick={() => setIsMenuOpen(false)}>
                              Addresses
                            </DropdownLink>
                            <DropdownLink to="/wishlist" icon={Heart} onClick={() => setIsMenuOpen(false)}>
                              Wishlist
                            </DropdownLink>
                            {user?.role === 'ADMIN' && (
                              <>
                                <div className="my-2 border-t border-zinc-100" />
                                <DropdownLink to="/admin" icon={HeartStraight} onClick={() => setIsMenuOpen(false)} highlight>
                                  Admin Dashboard
                                </DropdownLink>
                              </>
                            )}
                          </div>
                          <div className="border-t border-zinc-100 py-2">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <SignOut size={16} />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
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

              <button
                className="md:hidden p-2 text-zinc-600 hover:text-zinc-900"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={20} /> : <List size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="md:hidden border-t border-zinc-100 overflow-hidden"
              >
                <div className="py-4">
                  <nav className="flex flex-col gap-1">
                    <MobileNavLink to="/shop" active={location.pathname === '/shop'} onClick={() => setIsMenuOpen(false)}>
                      Shop
                    </MobileNavLink>
                    {isAuthenticated ? (
                      <>
                        <MobileNavLink to="/profile" active={location.pathname === '/profile'} onClick={() => setIsMenuOpen(false)}>
                          Profile
                        </MobileNavLink>
                        <MobileNavLink to="/orders" active={location.pathname === '/orders'} onClick={() => setIsMenuOpen(false)}>
                          Orders
                        </MobileNavLink>
                        <MobileNavLink to="/addresses" active={location.pathname === '/addresses'} onClick={() => setIsMenuOpen(false)}>
                          Addresses
                        </MobileNavLink>
                        <MobileNavLink to="/wishlist" active={location.pathname === '/wishlist'} onClick={() => setIsMenuOpen(false)}>
                          Wishlist
                        </MobileNavLink>
                        {user?.role === 'ADMIN' && (
                          <MobileNavLink to="/admin" active={location.pathname.startsWith('/admin')} onClick={() => setIsMenuOpen(false)} highlight>
                            Admin Dashboard
                          </MobileNavLink>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <SignOut size={16} />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <MobileNavLink to="/login" active={location.pathname === '/login'} onClick={() => setIsMenuOpen(false)}>
                          Sign In
                        </MobileNavLink>
                        <div className="px-4 pt-2">
                          <Link to="/register" className="btn-primary w-full justify-center" onClick={() => setIsMenuOpen(false)}>
                            Sign Up
                          </Link>
                        </div>
                      </>
                    )}
                  </nav>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-zinc-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={20} weight="fill" className="text-coral-500" />
                <span className="text-lg font-display font-semibold text-zinc-900">
                  Twinkle<span className="text-coral-500">Hearts</span>
                </span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Beautiful greeting cards delivered with love. Order via WhatsApp for a personal touch.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">Shop</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop" className="text-zinc-500 hover:text-coral-600 transition-colors">All Cards</Link></li>
                <li><Link to="/shop?category=birthday" className="text-zinc-500 hover:text-coral-600 transition-colors">Birthday</Link></li>
                <li><Link to="/shop?category=love" className="text-zinc-500 hover:text-coral-600 transition-colors">Love & Romance</Link></li>
                <li><Link to="/shop?category=anniversary" className="text-zinc-500 hover:text-coral-600 transition-colors">Anniversary</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/cart" className="text-zinc-500 hover:text-coral-600 transition-colors">Cart</Link></li>
                {isAuthenticated ? (
                  <>
                    <li><Link to="/orders" className="text-zinc-500 hover:text-coral-600 transition-colors">My Orders</Link></li>
                    <li><Link to="/wishlist" className="text-zinc-500 hover:text-coral-600 transition-colors">Wishlist</Link></li>
                    <li><Link to="/profile" className="text-zinc-500 hover:text-coral-600 transition-colors">Profile</Link></li>
                  </>
                ) : (
                  <li><Link to="/login" className="text-zinc-500 hover:text-coral-600 transition-colors">Sign In</Link></li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3 uppercase tracking-wider">Contact</h3>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <a href="https://wa.me/947XXXXXXXX" target="_blank" rel="noopener noreferrer" className="hover:text-coral-600 transition-colors">
                    WhatsApp: +94 7X XXX XXXX
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@twinklehearts.lk" className="hover:text-coral-600 transition-colors">
                    hello@twinklehearts.lk
                  </a>
                </li>
                <li className="pt-1 text-zinc-400">
                  Sri Lanka
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-100 text-center text-sm text-zinc-400">
            (c) 2026 TwinkleHearts. Made with{' '}
            <Heart size={14} weight="fill" className="text-coral-400 inline-block align-middle" /> in Sri Lanka.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---- Sub-components ---- */

function NavLink({
  to,
  active,
  onClick,
  children,
}: {
  to: string;
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative px-3 py-2 text-sm font-medium transition-colors"
    >
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute inset-0 bg-coral-50 rounded-lg -z-10"
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}
      <span className={`relative z-10 ${active ? 'text-coral-600' : 'text-zinc-600 hover:text-zinc-900'}`}>
        {children}
      </span>
    </Link>
  );
}

function MobileNavLink({
  to,
  active,
  highlight,
  onClick,
  children,
}: {
  to: string;
  active: boolean;
  highlight?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        highlight
          ? 'text-coral-600 bg-coral-50'
          : active
          ? 'text-coral-600 bg-coral-50'
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownLink({
  to,
  icon: Icon,
  onClick,
  highlight,
  children,
}: {
  to: string;
  icon: React.ElementType;
  onClick?: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
        highlight
          ? 'text-coral-600 hover:bg-coral-50 font-medium'
          : 'text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      <Icon size={16} className="text-zinc-400" />
      {children}
    </Link>
  );
}

function OfflineBanner() {
  const isOnline = useCartStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm font-body">
      You're offline. Your changes will sync when you're back online.
    </div>
  );
}
