import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import CartIcon from '../UI/CartIcon';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const itemCount = useCartStore((state) => state.getItemCount());
  const location = useLocation();

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
              <HeartIcon className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-900">Twinkle-Hearts</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Shop
              </Link>
              
              <Link to="/cart" className="relative">
                <CartIcon className="w-6 h-6 text-gray-600 hover:text-gray-900" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
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
                <li><Link to="/" className="hover:text-primary-500">Shop All</Link></li>
                <li><Link to="/cart" className="hover:text-primary-500">Cart</Link></li>
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
    <div className="offline-banner">
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
