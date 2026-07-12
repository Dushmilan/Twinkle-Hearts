import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from '../../utils/gsap-utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const itemCount = useCartStore((s) => s.getItemCount());
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (headerRef.current) {
      gsap.set(headerRef.current, { y: -80, opacity: 0 });
      gsap.to(headerRef.current, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.1 });
    }
    ScrollTrigger.refresh();
  }, [location.pathname]);

  useEffect(() => {
    if (footerRef.current) {
      gsap.fromTo(
        footerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: footerRef.current, start: 'top 90%' } },
      );
    }
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const tl = gsap.timeline();
    tl.fromTo('.dropdown-menu', { opacity: 0, y: -6, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(1.4)' });
    return () => { tl.kill(); };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const tl = gsap.timeline();
    tl.fromTo('.mobile-nav', { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' })
      .fromTo('.mobile-nav-item', { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out' }, '-=0.1');
    return () => { tl.kill(); };
  }, [isMobileNavOpen]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-twinkle-canvas flex flex-col">
      <OfflineBanner />

      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md border-b ${scrolled ? 'bg-white/95 shadow-sm border-twinkle-mist/60' : 'bg-white/70 border-twinkle-mist/20'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <Heart
                  size={20}
                  className="text-twinkle-rose group-hover:scale-110 transition-transform duration-300"
                />
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-twinkle-rose"
                  style={{ animation: 'pulseSoft 2s ease-in-out infinite' }}
                />
              </div>
              <span className="text-xl font-display font-semibold text-twinkle-ink tracking-tight">
                Twinkle<span className="text-twinkle-rose">Hearts</span>
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
                className="relative p-2.5 text-twinkle-ink/50 hover:text-twinkle-ink transition-colors rounded-xl hover:bg-twinkle-mist/30"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span
                    className="cart-badge absolute -top-0.5 -right-0.5 bg-twinkle-rose text-white text-[11px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center"
                    style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-twinkle-mist/30 transition-colors"
                  >
                    <div className="w-8 h-8 bg-twinkle-ink/10 rounded-full flex items-center justify-center">
                      <User size={15} className="text-twinkle-rose" />
                    </div>
                    <ChevronDown
                      size={10}
                      className={`text-twinkle-ink/40 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                      <div
                        className="dropdown-menu absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-twinkle-mist z-20 overflow-hidden"
                        style={{ opacity: 0, transform: 'translateY(-6px) scale(0.96)' }}
                      >
                        <div className="px-4 py-3 border-b border-twinkle-mist/40">
                          <p className="text-sm font-semibold text-twinkle-ink">{user?.name}</p>
                          <p className="text-xs text-twinkle-ink/50 truncate">{user?.email}</p>
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
                              <div className="my-1.5 border-t border-twinkle-mist/40" />
                              <DropdownLink to="/admin" icon={HeartPulse} onClick={() => setIsMenuOpen(false)} highlight>
                                Admin Dashboard
                              </DropdownLink>
                            </>
                          )}
                        </div>
                        <div className="border-t border-twinkle-mist/40 py-1.5">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-twinkle-rose hover:bg-twinkle-rose/20 transition-colors"
                          >
                            <LogOut size={15} />
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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
                className="md:hidden p-3 rounded-xl text-twinkle-ink/50 hover:text-twinkle-ink hover:bg-twinkle-mist/30 transition-colors"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                aria-label="Toggle navigation"
              >
                {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileNavOpen && (
          <div className="mobile-nav md:hidden border-t border-twinkle-mist/40 overflow-hidden" style={{ height: 0, opacity: 0 }}>
            <div className="py-4 px-4 space-y-1">
              <MobileNavItem to="/shop" label="Shop" location={location.pathname} onClick={() => setIsMobileNavOpen(false)} />

              <div className="pt-3 pb-2">
                <p className="text-[11px] font-semibold text-twinkle-ink/40 uppercase tracking-widest px-3">Account</p>
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
                    className="w-full text-left px-3 py-3 text-sm text-twinkle-rose hover:bg-twinkle-rose/20 rounded-lg transition-colors min-h-[44px]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="px-3 space-y-2 pt-1">
                  <Link to="/login" className="block w-full text-center py-3 text-sm font-medium text-twinkle-ink/70 hover:bg-twinkle-mist/30 rounded-lg transition-colors min-h-[44px] flex items-center justify-center" onClick={() => setIsMobileNavOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary w-full justify-center text-sm" onClick={() => setIsMobileNavOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main ref={mainRef} id="main-content" className="flex-1">
        {children}
      </main>

      <footer ref={footerRef} className="bg-twinkle-canvas border-t border-twinkle-mist/60 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-1 footer-column">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={18} className="text-twinkle-rose" />
                <span className="text-lg font-display font-semibold text-twinkle-ink tracking-tight">
                  Twinkle<span className="text-twinkle-rose">Hearts</span>
                </span>
              </div>
              <p className="text-sm text-twinkle-ink/60 leading-relaxed max-w-[48ch] font-body">
                Beautiful greeting cards delivered with care across Sri Lanka. Order via WhatsApp for a personal touch.
              </p>
            </div>

            <div className="footer-column">
              <h3 className="text-xs font-semibold text-twinkle-ink mb-4 uppercase tracking-widest">Shop</h3>
              <ul className="space-y-2.5">
                <FooterLink to="/shop">All Cards</FooterLink>
                <FooterLink to="/shop?category=birthday">Birthday</FooterLink>
                <FooterLink to="/shop?category=love">Love</FooterLink>
                <FooterLink to="/shop?category=anniversary">Anniversary</FooterLink>
                <FooterLink to="/shop?category=festival">Festival</FooterLink>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="text-xs font-semibold text-twinkle-ink mb-4 uppercase tracking-widest">Account</h3>
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

            <div className="footer-column">
              <h3 className="text-xs font-semibold text-twinkle-ink mb-4 uppercase tracking-widest">Contact</h3>
              <ul className="space-y-2.5 text-sm text-twinkle-ink/60">
                <li>
                  <a href="https://wa.me/947XXXXXXXX" target="_blank" rel="noopener noreferrer" className="hover:text-twinkle-rose transition-colors">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@twinklehearts.lk" className="hover:text-twinkle-rose transition-colors">
                    hello@twinklehearts.lk
                  </a>
                </li>
                <li className="text-twinkle-ink/40 text-xs pt-1">
                  Colombo, Sri Lanka
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-column mt-10 pt-6 border-t border-twinkle-mist/40 text-center">
            <p className="text-xs text-twinkle-ink/40">
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
        <span className="absolute inset-0 bg-twinkle-rose/20 rounded-lg -z-10" />
      )}
      <span className={`relative z-10 ${active ? 'text-twinkle-rose' : 'text-twinkle-ink/70 hover:text-twinkle-ink'}`}>
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
    <div className="mobile-nav-item" style={{ opacity: 0 }}>
      <Link
        to={to}
        onClick={onClick}
        className={`block px-3 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
          highlight
            ? 'text-twinkle-rose bg-twinkle-rose/20'
            : active
            ? 'text-twinkle-rose bg-twinkle-rose/20'
            : 'text-twinkle-ink/50 hover:text-twinkle-ink hover:bg-twinkle-mist/30'
        }`}
      >
        {label}
      </Link>
    </div>
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
          ? 'text-twinkle-rose hover:bg-twinkle-rose/20 font-medium'
          : 'text-twinkle-ink/70 hover:bg-twinkle-mist/30'
      }`}
    >
      <Icon size={15} className="text-twinkle-ink/50" />
      {children}
    </Link>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-twinkle-ink/50 hover:text-twinkle-rose transition-colors">
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