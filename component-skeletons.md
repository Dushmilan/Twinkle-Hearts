# Component Skeletons — Twinkle-Hearts

Pattern reference for generating new components. Each skeleton shows the exact imports, hooks, stores, and styling conventions used in this codebase.

---

## 1. UI Component (reusable primitive)

`components/UI/MyComponent.tsx`

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from '@phosphor-icons/react';

interface MyComponentProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

export default function MyComponent({ label, onClick, className = '' }: MyComponentProps) {
  const [active, setActive] = useState(false);

  return (
    <motion.div
      className={`card p-4 ${className}`}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Heart size={20} weight="duotone" className="text-greeting-magenta-400" />
      <button
        onClick={() => { setActive(!active); onClick?.(); }}
        className="font-display text-sm font-semibold text-gray-100 hover:text-greeting-magenta-400 transition-colors"
      >
        {label}
      </button>
      {active && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs text-emerald-600"
        >
          Active
        </motion.span>
      )}
    </motion.div>
  );
}
```

### Variant: memo-ized UI component (performance-critical)

```tsx
import { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from '@phosphor-icons/react';
import { formatPrice } from './Icons';

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
}

const ProductCard = memo(function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <motion.div
      className="card group overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <h3 className="font-display text-sm font-semibold text-gray-100 line-clamp-2">{product.name}</h3>
      <span className="font-mono text-base font-semibold text-greeting-magenta-400 tracking-tight">
        {formatPrice(product.price)}
      </span>
    </motion.div>
  );
});

export default ProductCard;
```

### Variant: multi-export file (icons, constants, utilities)

```tsx
import type { ElementType } from 'react';

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318..." />
    </svg>
  );
}

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString('en-IN')}`;
}

export const CATEGORY_MAP: Record<string, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
};

export const CATEGORY_BADGE: Record<string, string> = {
  birthday: 'badge-magenta',
  wedding: 'badge-purple',
};
```

---

## 2. Page Component

`pages/MyFeature/MyFeaturePage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft } from '@phosphor-icons/react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import { getImageSrc } from '../../utils/images';
import toastService from '../../utils/toast';
import { CartSkeleton } from '../../components/UI/LoadingSkeleton';
import EmptyState from '../../components/UI/EmptyState';

export default function MyFeaturePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items } = useCartStore();

  const [data, setData] = useState<MyDataType[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // const res = await api.getMyData();
        // setData(res.data);
      } catch (err) {
        toastService.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <CartSkeleton />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={Heart}
          title="Nothing here yet"
          description="Your content will appear here."
          actionLabel="Go Home"
          actionTo="/"
          iconClassName="w-12 h-12"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-100 mb-1">
          Page Title
        </h1>
        <p className="text-gray-400">
          Description or subtitle
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <div key={item.id} className="card p-4">
            {/* item content */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 3. Layout Component

`components/Layout/MyLayout.tsx`

```tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X, Heart } from '@phosphor-icons/react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';

interface MyLayoutProps {
  children: React.ReactNode;
}

export default function MyLayout({ children }: MyLayoutProps) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getItemCount, isOnline } = useCartStore();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-greeting-bg-500">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-greeting-bg-500/90 backdrop-blur-md border-b border-greeting-purple-900">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-gray-100">
            Twinkle Hearts
          </Link>
          {/* nav items */}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-greeting-dark-purple-900 border-t border-greeting-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} Twinkle Hearts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

---

## 4. Store (Zustand)

`store/myStore.ts`

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MyState {
  value: string;
  items: string[];
  setValue: (val: string) => void;
  addItem: (item: string) => void;
  clear: () => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set, get) => ({
      value: '',
      items: [],
      setValue: (val) => set({ value: val }),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      clear: () => set({ value: '', items: [] }),
    }),
    {
      name: 'my-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## 5. Auth-Protected Component

Used inside `<ProtectedRoute>` or `<AdminRoute>` wrappers.

```tsx
import { useAuth } from '../../context/AuthContext';

export default function MyProtectedComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="skeleton-shimmer h-32 w-full" />;
  }

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout} className="text-sm text-gray-400 hover:text-greeting-magenta-400">
        Sign out
      </button>
    </div>
  );
}
```

---

## 6. Loading Skeleton

`components/UI/LoadingSkeleton.tsx` — see existing. New skeletons follow the same pattern:

```tsx
import { LoadingSkeleton } from './LoadingSkeleton';

export function MyFeatureSkeleton() {
  return (
    <div className="card p-6">
      <LoadingSkeleton className="h-6 w-1/3 mb-4" />
      <LoadingSkeleton className="h-4 w-full mb-2" />
      <LoadingSkeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-10 w-24" />
        <LoadingSkeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
```

---

## Pattern Reference

| Concern | Convention |
|---|---|
| **Imports order** | React → react-router-dom → framer-motion → phosphor-icons → stores → context → utils → components |
| **Export** | `export default function` for single component; named exports for multi-export files |
| **Props interface** | `interface XxxProps` at file top, before component |
| **State** | Local `useState` for UI state; Zustand for shared/global state |
| **Auth** | `useAuth()` from `context/AuthContext` |
| **Routing** | `useNavigate()`, `useLocation()`, `<Link>`, `<Navigate>` from react-router-dom |
| **Toasts** | `toastService.success/error/loading/dismiss/promise` from `utils/toast` |
| **Images** | `getImageSrc(url)` from `utils/images` (handles relative/absolute URLs) |
| **Animations** | `motion.div` + spring transitions; `AnimatePresence` for enter/exit |
| **Icons** | `@phosphor-icons/react` (snake_case names like `ShoppingCart`, `Heart`) |
| **Styling** | Tailwind with custom `greeting-*` palette, `font-display`/`font-mono`/`font-body` |
| **Price format** | `formatPrice(price)` from `components/UI/Icons` (or inline `Intl.NumberFormat`) |
| **Empty state** | `<EmptyState>` component from `components/UI/EmptyState` |
| **Loading** | Skeleton components from `components/UI/LoadingSkeleton` (`CartSkeleton`, `ProductSkeleton`, etc.) |
| **Error boundary** | `<ErrorBoundary>` wraps page or feature |
