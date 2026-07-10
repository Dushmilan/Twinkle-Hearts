import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  User,
  Package,
  MapPin,
  LogOut,
  Menu,
  X,
  ChevronDown,
  HeartPulse,
  Sparkle,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
      delay: i * 0.04,
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export default function Layout({ children }: LayoutProps) {
  const itemCount = useCartStore((s) => s.getItemCount());
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-greeting-charcoal-200 flex flex-col">
      <OfflineBanner />

      <header className="sticky top-0 z-50 bg-greeting-charcoal-200/80 backdrop-blur-lg border-b border-greeting-bronze-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <Heart
                  size={20}
                  className="text-greeting-plum-500 group-hover:scale-110 transition-transform duration-300"
                />
                <motion.span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-greeting-plum-400"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
              </div>
              <span className="text-xl font-display font-semibold text-gray-100 tracking-tight">
                Twinkle<span className="text-greeting-plum-400">Hearts</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/shop" active={location.pathname === '/shop'}>
                <Sparkle size={14} />
                Shop
              </NavLink>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/cart"
                className="relative p-2.5 text-gray-400 hover:text-gray-100 transition-colors rounded-xl hover:bg-greeting-bronze-400"
              >
                <ShoppingCart size={20} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="absolute -top-0.5 -right-0.5 bg-greeting-plum-500 text-white text-[11px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-greeting-bronze-400 transition-colors"
                  >
                    <div className="w-8 h-8 bg-greeting-plum-900 rounded-full flex items-center justify-center">
                      <User size={15} className="text-greeting-plum-400" />
                    </div>
                    <ChevronDown
                      size={10}
                      className={`text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className="absolute right-0 mt-2 w-56 bg-greeting-charcoal-400 rounded-xl shadow-lg border border-greeting-bronze-400 z-20 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-greeting-bronze-400">
                            <p className="text-sm font-semibold text-gray-100">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1.5">
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
                                <div className="my-1.5 border-t border-greeting-bronze-400" />
                                <DropdownLink to="/admin" icon={HeartPulse} onClick={() => setIsMenuOpen(false)} highlight>
                                  Admin Dashboard
                                </DropdownLink>
                              </>
                            )}
                          </div>
                          <div className="border-t border-greeting-bronze-400 py-1.5">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-greeting-plum-400 hover:bg-greeting-plum-500/20 transition-colors"
                            >
                              <LogOut size={15} />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm py-2 px-4">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-5">
                    Sign Up
                  </Link>
                </div>
              )}

              <button
                className="md:hidden p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-greeting-bronze-400 transition-colors"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                aria-label="Toggle navigation"
              >
                {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="md:hidden border-t border-greeting-bronze-400 overflow-hidden"
            >
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="py-4 px-4 space-y-1"
              >
                <MobileNavItem to="/shop" label="Shop" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} />

                <div className="pt-3 pb-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-3">Account</p>
                </div>

                {isAuthenticated ? (
                  <>
                    <MobileNavItem to="/profile" label="Profile" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} />
                    <MobileNavItem to="/orders" label="Orders" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} />
                    <MobileNavItem to="/addresses" label="Addresses" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} />
                    <MobileNavItem to="/wishlist" label="Wishlist" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} />
                    {user?.role === 'ADMIN' && (
                      <MobileNavItem to="/admin" label="Admin Dashboard" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} highlight />
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 text-sm text-greeting-plum-400 hover:bg-greeting-plum-500/20 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="px-3 space-y-2 pt-1">
                    <Link to="/login" className="block w-full text-center py-2.5 text-sm font-medium text-gray-300 hover:bg-greeting-bronze-400 rounded-lg transition-colors" onClick={() => setIsMobileNavOpen(false)}>
                      Sign In
                    </Link>
                    <Link to="/register" className="btn-primary w-full justify-center text-sm" onClick={() => setIsMobileNavOpen(false)}>
                      Sign Up
                    </Link>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-greeting-charcoal-400 border-t border-greeting-bronze-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={18} className="text-greeting-plum-400" />
                <span className="text-lg font-display font-semibold text-gray-100 tracking-tight">
                  Twinkle<span className="text-greeting-plum-400">Hearts</span>
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-[48ch] font-body">
                Beautiful greeting cards delivered with care across Sri Lanka. Order via WhatsApp for a personal touch.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-100 mb-4 uppercase tracking-widest">Shop</h3>
              <ul className="space-y-2.5">
                <FooterLink to="/shop">All Cards</FooterLink>
                <FooterLink to="/shop?category=birthday">Birthday</FooterLink>
                <FooterLink to="/shop?category=love">Love</FooterLink>
                <FooterLink to="/shop?category=anniversary">Anniversary</FooterLink>
                <FooterLink to="/shop?category=festival">Festival</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-100 mb-4 uppercase tracking-widest">Account</h3>
              <ul className="space-y-2.5">
                <FooterLink to="/cart">Cart</FooterLink>
                {isAuthenticated ? (
                  <>
                    <FooterLink to="/orders">My Orders</FooterLink>
                    <FooterLink to="/wishlist">Wishlist</FooterLink>
                    <FooterLink to="/profile">Profile</FooterLink>
                  </>
                ) : (
                  <FooterLink to="/login">Sign In</FooterLink>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-100 mb-4 uppercase tracking-widest">Contact</h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <a href="https://wa.me/947XXXXXXXX" target="_blank" rel="noopener noreferrer" className="hover:text-greeting-plum-400 transition-colors">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@twinklehearts.lk" className="hover:text-greeting-plum-400 transition-colors">
                    hello@twinklehearts.lk
                  </a>
                </li>
                <li className="text-gray-500 text-xs pt-1">
                  Colombo, Sri Lanka
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-greeting-bronze-400 text-center">
            <p className="text-xs text-gray-500">
              &copy; 2026 TwinkleHearts. Made with care in Sri Lanka.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---- Sub-components ---- */

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="relative px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"
    >
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute inset-0 bg-greeting-plum-500/20 rounded-lg -z-10"
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        />
      )}
      <span className={`relative z-10 ${active ? 'text-greeting-plum-300' : 'text-gray-300 hover:text-gray-100'}`}>
        {children}
      </span>
    </Link>
  );
}

function MobileNavItem({ to, label, location, highlight, onClick }: {
  to: string;
  label: string;
  location: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const active = location === to || location.startsWith(to + '/');
  return (
    <motion.div variants={menuItemVariants} custom={0}>
      <Link
        to={to}
        onClick={onClick}
        className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          highlight
            ? 'text-greeting-plum-300 bg-greeting-plum-500/20'
            : active
            ? 'text-greeting-plum-300 bg-greeting-plum-500/20'
            : 'text-gray-400 hover:text-gray-100 hover:bg-greeting-bronze-400'
        }`}
      >
        {label}
      </Link>
    </motion.div>
  );
}

function DropdownLink({ to, icon: Icon, onClick, highlight, children }: {
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
          ? 'text-greeting-plum-300 hover:bg-greeting-plum-500/20 font-medium'
          : 'text-gray-300 hover:bg-greeting-bronze-400'
      }`}
    >
      <Icon size={15} className="text-gray-400" />
      {children}
    </Link>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-gray-400 hover:text-greeting-plum-400 transition-colors">
        {children}
      </Link>
    </li>
  );
}

function OfflineBanner() {
  const isOnline = useCartStore((s) => s.isOnline);
  if (isOnline) return null;
  return (
    <div className="bg-amber-50 text-amber-800 px-4 py-2 text-center text-sm font-body border-b border-amber-100">
      You are offline. Changes will sync when connected.
    </div>
  );
}
