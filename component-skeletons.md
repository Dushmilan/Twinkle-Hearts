# Component Skeletons — Twinkle-Hearts

Accurate reference for all pages, layouts, and components. Derived from the actual
codebase — not generic skeletons. A designing LLM should use this as the source of
truth for imports, patterns, and structure.

---

## 1. Application Shell & Routing

### Entry: `frontend/src/main.tsx`
```
React.StrictMode > BrowserRouter > App
```

### Route Table: `frontend/src/App.tsx`

```
ErrorBoundary > AuthProvider > AppRoutes + Toaster (react-hot-toast)
```

`AppRoutes` calls `useCartStore(s => s.syncCart)` in a `useEffect` on mount.

| Path | Component | Auth |
|------|-----------|------|
| `/` | HomePage | public |
| `/shop` | ShopPage | public |
| `/product/:id` | ProductDetailPage | public |
| `/cart` | CartPage | public |
| `/login` | LoginPage | public |
| `/register` | RegisterPage | public |
| `/checkout` | CheckoutPage | protected |
| `/order-success/:orderId` | OrderSuccessPage | protected |
| `/profile` | ProfilePage | protected |
| `/orders` | OrderHistoryPage | protected |
| `/addresses` | AddressManagementPage | protected |
| `/wishlist` | WishlistPage | protected |
| `/admin` | AdminDashboardPage | admin |
| `/admin/orders` | AdminOrdersPage | admin |
| `/admin/products` | AdminProductsPage | admin |
| `/admin/users` | AdminUsersPage | admin |

All routes render inside a single `<Layout>` component (nav + footer shell).
Auth pages (Login, Register) are exceptions — they render their own full-screen layouts.

---

## 2. Layout — `components/Layout/Layout.tsx`

**One monolithic 422-line file.** No separate Header/Footer components. Everything is
inline including `OfflineBanner`, `NavLink`, `MobileNavItem`, `DropdownLink`, `FooterLink`.

### Imports
```tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingCart, User, Package, MapPin,
  LogOut, Menu, X, ChevronDown, HeartPulse, Sparkle,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
```

### Stores/Hooks
- `useCartStore(s => s.getItemCount())`
- `useAuth()` → `{ isAuthenticated, user, logout }`
- `useLocation()`, `useNavigate()`
- `useState` for `isMenuOpen`, `isMobileNavOpen`

### Structure
```
<div className="min-h-[100dvh] bg-greeting-charcoal-200 flex flex-col">
  <OfflineBanner />                        // inline, reads useCartStore.isOnline
  <header>                                 // sticky, top-0, z-50, glass effect
    Logo (Heart icon + "TwinkleHearts")    // plum-400 accent
    Desktop nav: Shop link only            // hidden on mobile
    Cart icon with badge                   // animated, shows "9+" for >9
    Auth section:
      Authenticated: avatar dropdown       // Profile, Orders, Addresses, Wishlist, Admin, Logout
      Unauthenticated: Sign In + Sign Up   // ghost + primary buttons
    Mobile hamburger toggle
    Mobile nav drawer                      // AnimatePresence animated
  </header>
  <main className="flex-1">{children}</main>
  <footer>                                 // dark charcoal, 4-column grid
    Brand column                           // Heart icon + "TwinkleHearts" + tagline
    Shop links                             // All Cards, Birthday, Love, Anniversary, Festival
    Account links                          // Cart, My Orders/Wishlist/Profile (auth) or Sign In
    Contact                                // WhatsApp wa.me/947XXXXXXXX, email, Colombo SL
    Copyright                              // "2026 TwinkleHearts. Made with care in Sri Lanka."
  </footer>
</div>
```

### Key pattern
- Tailwind palette: `greeting-charcoal-*`, `greeting-plum-*`, `greeting-purple-*`
- Glass header: `bg-greeting-bg-500/90 backdrop-blur-md`
- Desktop nav is minimal — only "Shop" link
- Mobile nav is a full-screen animated drawer
- Footer is a 4-column grid with category links, account links, contact info

---

## 3. All Pages (14 components)

### 3.1 HomePage — `pages/Home/HomePage.tsx`

**The most complex page.** 5 major sections with multiple inline sub-components.

```tsx
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, type Variants } from 'framer-motion';
import { Sparkle, Heart, ArrowRight, Star, MessageCircle, ShoppingBag, Package, Users, Palette, Quote } from 'lucide-react';
import { api } from '../../api';
import { getImageSrc } from '../../utils/images';
import type { ProductListItem } from '@twinkle-hearts/shared';
```

**Sections:**
1. **Trilingual Asymmetric Hero** (7/5 col grid, `bg-greeting-charcoal-50`)
   - Animated headline: English + Tamil + Sinhala + English ("Say it with a / ஒரு அழகான அட்டையுடன் / ලස්සන කාඩ් එකකින් කියන්න / beautiful card")
   - Stats: 1200+ orders, 65+ designs, 4.9 rating
   - 3 `FloatingLetterpressCard` components (animated floating paper card mockups)
2. **Categories Bento Grid** — 6 category cards (Birthday, Love, Anniversary, Friendship, Festival, Sympathy)
3. **Featured Products** — fetches up to 8 via `api.products.list({ limit: 8 })`, local `ProductCard`
4. **About + Stats Split** — 4 `StatCard`s, 3 `FeatureItem`s
5. **CTA Section** — dark bg with grain texture overlay, "Ready to make someone smile?"

**Inline sub-components:** `WhatsappLogo` (SVG), `FloatingLetterpressCard`, `MagneticButton` (useMotionValue cursor tracking), local `ProductCard`, `FeatureItem`, `StatCard`

**Unique patterns:**
- Grain overlay: `<div className="fixed inset-0 z-50 pointer-events-none grain" />`
- Trilingual content hardcoded (no i18n)
- `MagneticButton` uses `useMotionValue` for cursor proximity

---

### 3.2 ShopPage — `pages/Shop/ShopPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api';
import { getImageSrc } from '../../utils/images';
```

**Stores:** `useCartStore(state => state.addItem)`

**Structure:**
1. Page Header (`bg-greeting-bronze-100`)
2. Category Pills (sticky below header, `top-16 z-30`) — 7 categories with emoji labels, synced with URL search params (`?category=...`)
3. Products Grid — `api.products.list({ limit: 20, category })`

**Custom CSS classes:** `product-card`, `product-card-image`, `product-card-body`, `category-pill`, `category-pill-active`

---

### 3.3 ProductDetailPage — `pages/ProductDetail/ProductDetailPage.tsx`

```tsx
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api';
import { getImageSrc } from '../../utils/images';
import type { Product } from '@twinkle-hearts/shared';
```

**Stores:** `useCartStore(state => state.addItem)`

**Structure:**
- 2-col grid: main image (aspect 4/5) + thumbnail strip | category badge, title, price ("Rs. X incl. tax"), description, stock status, quantity selector, Add to Cart, WhatsApp CTA, details section

**Inline sub-components:** Local `HeartIcon`, `WhatsAppIcon` (SVG, duplicated)

---

### 3.4 CartPage — `pages/Cart/CartPage.tsx`

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { HeartIcon, WhatsAppIcon } from '../../components/UI/Icons';
import { getImageSrc } from '../../utils/images';
import type { CartItem } from '../../store/cartStore';
```

**Stores:** `useCartStore()` — `items`, `updateQuantity`, `removeItem`, `getTotal`, `clearCart`

**Structure:**
- Empty state or 3/5 col grid
- Left: cart items list + "Clear all items"
- Right: sticky order summary card (dashed border, "gift receipt" style), HeartIcon, line items, subtotal, free shipping, 18% tax (client-side `total * 0.18`), total, "Send Order via WhatsApp" → `/checkout`

**Pattern:** Uses shared `HeartIcon`/`WhatsAppIcon` from `components/UI/Icons`.

---

### 3.5 CheckoutPage — `pages/Checkout/CheckoutPage.tsx`

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api';
import { HeartIcon, WhatsAppIcon } from '../../components/UI/Icons';
```

**Stores:** `useCartStore()` — `items`, `getTotal`, `clearCart`

**Structure:**
- Empty state if no items
- 3/5 col grid: form (Full Name, Country select, WhatsApp number with +94 prefix) | sticky order summary
- On submit: `api.orders.create({ items, customerName, customerPhone })`, opens `order.whatsappDeepLink`, navigates to `/order-success/:id`, clears cart
- Tax rate from `import.meta.env.VITE_TAX_RATE` (default `0.18`)
- Double-submit guard via `isSubmitting` state

---

### 3.6 OrderSuccessPage — `pages/OrderSuccess/OrderSuccessPage.tsx`

```tsx
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api';
```

No Zustand stores. Fetches order via `api.orders.get(id)`.

**Structure:** Green checkmark, "Order Placed!", order summary card, "Next Step" WhatsApp explanation, "Continue Shopping" link.

---

### 3.7 LoginPage — `pages/Auth/LoginPage.tsx`

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/authStore';
```

**Stores:** `useAuth()` context, `useAuthStore.getState()` (for reading user role after login)

**Structure:** Full-screen centered card on dark charcoal with decorative floating dots. Logo, email + password form, "Remember me" checkbox, Google button (non-functional), "Don't have an account?" link. After login: admin → `/admin`, others → `from` location or `/`.

**Inline sub-component:** Local `HeartIcon` SVG (duplicated from Icons.tsx).

---

### 3.8 RegisterPage — `pages/Auth/RegisterPage.tsx`

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
```

**Stores:** `useAuth()` context (provides `register`)

**Structure:** Same full-screen card style as Login. Full Name, Email, Phone (+94 prefix), Password (strength meter), Confirm Password. Client validation: name required, email format, phone 9-10 digits, password 8+ with upper/lower/digit/special.

---

### 3.9 ProfilePage — `pages/Profile/ProfilePage.tsx`

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { ProfileSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';
```

**Stores:** `useAuthStore` — `user`, `updateUser`, `isAuthenticated`, `isLoading`

**Structure:** Avatar circle (first letter), name, email, role badge. View mode (phone, member since) or Edit mode (name, email disabled, phone, save/cancel). Calls `api.auth.updateProfile()`.

---

### 3.10 OrderHistoryPage — `pages/Orders/OrderHistoryPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { OrderSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';
```

**Stores:** `useAuthStore(state => state.isAuthenticated)`

**Structure:** Orders list. Each card: truncated order ID, formatted date, status badge (Pending/Confirmed/Cancelled/Expired), items, total, "View Details" link. Calls `api.orders.list()`.

---

### 3.11 AddressManagementPage — `pages/Address/AddressManagementPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { api } from '../../api';
import toastService from '../../utils/toast';
```

No Zustand store (uses `api` directly, relies on ProtectedRoute for auth).

**Structure:** Address grid (2 cols). Add/Edit form: label, phone (+94 prefix), street, city, state, ZIP, country (Sri Lanka only), default checkbox. CRUD via `api.addresses.*`.

---

### 3.12 WishlistPage — `pages/Wishlist/WishlistPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { getImageSrc } from '../../utils/images';
import { ProductSkeleton } from '../../components/UI/LoadingSkeleton';
import toastService from '../../utils/toast';
```

**Stores:** `useAuthStore(state => state.isAuthenticated)`

**Structure:** Wishlist grid (2-4 cols). Each: product image, remove button (X overlay), category, name, price, View + Add buttons. Calls `api.wishlist.list()`, `api.wishlist.remove()`.

---

### 3.13 AdminDashboardPage — `pages/Admin/DashboardPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api';
```

No Zustand store.

**Structure:** Stats grid (4 cards: Orders, Revenue, Users, Cards), pending orders alert, Quick Actions (3 cards → products/orders/users), Recent Orders table. Calls `api.admin.stats()`.

**Note:** Wraps itself in `<AdminRoute>` (double-wrapped since App.tsx also wraps it).

---

### 3.14 AdminOrdersPage — `pages/Admin/OrdersPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api';
import toastService from '../../utils/toast';
```

**Structure:** Orders table (light theme, white bg): Order ID, Customer (name + email), Items, Total, Date. Pagination. Calls `api.admin.orders(page, 20)`.

---

### 3.15 AdminProductsPage — `pages/Admin/ProductsPage.tsx`

```tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api';
import toastService from '../../utils/toast';
import ImageUpload from '../../components/ImageUpload';
import { getImageSrc } from '../../utils/images';
```

**Structure:** Products table with create/edit form (Name, Description, Price, Stock, Category, `ImageUpload` for multi-image, Active checkbox). Search bar. Calls `api.admin.products.*`.

---

### 3.16 AdminUsersPage — `pages/Admin/UsersPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';
import { api } from '../../api';
import toastService from '../../utils/toast';
```

**Structure:** Search bar with 500ms debounce. Users table: Name + Email, Phone, Role (dropdown), Activity counts, Joined date. Pagination.

---

## 4. Reusable Components

### `components/ProtectedRoute.tsx`
- Exports: `ProtectedRoute`, `AdminRoute`
- `ProtectedRoute`: loading → `CartSkeleton`, not authenticated → redirect `/login` with `{ from }`, else render children
- `AdminRoute`: same + checks `user?.role !== 'ADMIN'` → redirect `/`

### `components/ImageUpload.tsx`
- Props: `initialImages`, `onFilesChange`, `onExistingImagesChange`, `maxImages` (5), `multiple`, `isUploading`, `disabled`
- Features: file selection with preview (blob URLs), JPEG/PNG/GIF/WebP validation, 5MB limit, drag area, image grid with reorder, remove, "Primary"/"New" badges
- Used by: `AdminProductsPage`

### `components/UI/Icons.tsx`
- Exports: `HeartIcon`, `WhatsAppIcon`, `HeartSparkle` (SVGs), `CATEGORY_MAP`, `CATEGORY_BADGE`, `formatPrice`
- `formatPrice` uses `Intl.NumberFormat` for LKR
- **Only imported by:** CartPage, CheckoutPage, and shared ProductCard

### `components/UI/LoadingSkeleton.tsx`
- Exports: `LoadingSkeleton` (base), `ProductSkeleton`, `OrderSkeleton`, `ProfileSkeleton`, `CartSkeleton`
- Pattern: `skeleton-shimmer` CSS class
- Used by: ProtectedRoute (CartSkeleton), ProfilePage, OrderHistoryPage, WishlistPage

### `components/UI/ProductCard.tsx`
- Memoized, uses `useCartStore.addItem` directly, lucide-react icons
- **Not imported by any page** — pages define their own local ProductCard sub-components

### `components/UI/EmptyState.tsx`
- Props: `icon`, `title`, `description`, `actionLabel?`, `actionHref?`/`actionTo?`, `iconClassName?`
- **Not imported by any page** — pages create inline empty states

### `components/UI/CartIcon.tsx`
- **Not imported anywhere** — superseded by lucide-react's `ShoppingCart`

---

## 5. Stores

### `store/authStore.ts`
- Zustand + `persist` (localStorage key: `auth-storage`)
- State: `user`, `tokens`, `isAuthenticated`, `isLoading`
- Actions: `login`, `logout`, `updateUser`, `setTokens`, `clearUser`
- Exports: `authAPI` object (login, register, logout, getCurrentUser, refreshToken)
- Wires `setTokenGetter` so `api.ts` auto-injects access token

### `store/cartStore.ts`
- Zustand + `persist` (localStorage key: `cart-storage`, persists `items` + `lastSyncedAt`)
- State: `items: CartItem[]`, `lastSyncedAt`, `isSyncing`, `isOnline`
- CartItem shape: `{ productId, productName?, quantity, price, image?, addedAt }`
- Actions: `addItem` (upserts + IndexedDB write + auto-sync), `removeItem`, `updateQuantity`, `clearCart`, `syncCart`, `setOnlineStatus`, `getTotal()`, `getItemCount()`
- Exported selectors: `selectCartItems`, `selectCartTotal`, `selectCartItemCount`, `selectIsSyncing`, `selectIsOnline`

### `store/cart-db.ts`
- Dexie IndexedDB operations: `upsertCartItem`, `removeCartItem`, `updateCartItemQuantity`, `clearCartItems`

### `store/cart-sync.ts`
- `syncWithBackend(items)` — POSTs to `api.cart.sync()`, maps validated prices from response

### `store/db.ts`
- Dexie database `TwinkleHeartsDB` with tables: `cart`, `pendingOrders` (pendingOrders unused)

---

## 6. Context & Hooks

### `context/AuthContext.tsx`
- Exports: `AuthProvider`, `useAuth()`
- State: `user`, `tokens`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`, `updateUser`
- On mount: if refreshToken exists → refresh + getCurrentUser, else clearUser
- All actions use `toastService` for notifications

### `hooks/useOnlineStatus.ts`
- Listens to window online/offline events, syncs to `useCartStore.setOnlineStatus()`

---

## 7. Pattern Reference

| Concern | Convention |
|---|---|
| **Icons** | `lucide-react` (NOT phosphor-icons) |
| **State** | `useAuthStore` (Zustand + persist) for auth; `useCartStore` (Zustand + persist + Dexie) for cart |
| **Auth context** | `useAuth()` from `context/AuthContext` wraps store with async operations + toasts |
| **Routing** | `react-router-dom` — `useNavigate()`, `useLocation()`, `<Link>`, `<Navigate>`, `<Route>` |
| **API** | `import { api } from '../../api'` — domain clients (`api.auth`, `api.products`, `api.cart`, `api.orders`, `api.addresses`, `api.wishlist`, `api.admin`) |
| **Toasts** | `toastService.success/error/loading/dismiss` from `utils/toast` |
| **Images** | `getImageSrc(url)` from `utils/images` |
| **Animations** | `framer-motion` — `motion.div`, `AnimatePresence`, spring transitions, staggered variants |
| **Styling** | Tailwind with custom palette: `greeting-charcoal-*`, `greeting-plum-*`, `greeting-purple-*`, `greeting-bronze-*`, `greeting-magenta-*` |
| **Fonts** | `font-display` (headings), `font-mono` (prices), `font-body` (body) |
| **Price format** | `formatPrice()` from `components/UI/Icons` or inline `Intl.NumberFormat` |
| **Loading** | Skeleton components from `components/UI/LoadingSkeleton` |
| **Error boundary** | `<ErrorBoundary>` wraps entire app in `App.tsx` |
| **Auth protection** | `<ProtectedRoute>` / `<AdminRoute>` wrappers in route definitions |
| **Tax** | 18% VAT, computed server-side; client displays `total * 0.18` or reads `VITE_TAX_RATE` |
| **Export** | `export default function` for pages/layouts; named exports for multi-export files |

---

## 8. Known Anomalies

1. **3 duplicate ProductCards**: shared (`components/UI/ProductCard.tsx`), HomePage local, ShopPage local. Shared one is unused by pages.
2. **Duplicate SVGs**: `HeartIcon`, `WhatsAppIcon` re-defined locally in ProductDetailPage, CartPage (uses shared), OrderSuccessPage, LoginPage, RegisterPage.
3. **EmptyState unused**: Component exists but no page imports it — inline empty states everywhere.
4. **Admin double-wrapping**: All 4 admin pages wrap in `<AdminRoute>` themselves, but App.tsx also wraps them.
5. **Currency inconsistency**: Admin pages use `₹` (Indian rupee) instead of `Rs.` (LKR).
6. **Dexie pendingOrders unused**: Table defined but no frontend code writes to it — offline order queuing not implemented.
