# Design System: Twinkle-Hearts (v2 — Warm Redesign)

> **Date:** 2026-07-10
> **Direction:** Warm, romantic, artisanal boutique
> **Status:** Locked — all 25 design branches resolved

## 1. Visual Theme & Atmosphere

A warm, romantic boutique greeting-card shop with dark, intimate ambiance. Deep warm-charcoal backgrounds feel like a dimly lit room with candlelight. Warm berry and teal accents provide romance and life. Cocoa brown borders ground everything in earthiness. Solid cards with paper shadows feel like physical greeting cards on a dark shelf. Playfair Display headings add editorial elegance. The grain texture prevents flatness.

## 2. Color Palette & Roles

### Core Scales (Tailwind config → `greeting-*` prefix)

#### `greeting-berry` — Hero / Primary Accent
| Shade | Hex | Usage |
|---|---|---|
| 50 | `#FDF2F4` | — |
| 100 | `#FCE7EB` | — |
| 200 | `#F9C4D0` | — |
| 300 | `#E896AC` | Hover text for links, active nav indicators |
| 400 | `#D43A6A` | **Primary accent**: CTAs, links, prices, badges, icons, focus rings |
| 500 | `#C02E5A` | Primary button bg, ring defaults, loading spinners |
| 600 | `#A8264C` | Button hover/active states |
| 700 | `#8F1E3E` | Darker hover states |
| 800 | `#7A1A34` | Very dark hover/pressed states |
| 900 | `#5C1228` | Deepest berry, never used directly |

**Role**: Single hero accent for CTAs, active states, prices, badges, focus rings, link hovers, loading states. Berry replaces the old magenta.

#### `greeting-cocoa` — Structural / Borders
| Shade | Hex | Usage |
|---|---|---|
| 50 | `#F5F0ED` | — |
| 100 | `#E8DED7` | — |
| 200 | `#D0BFB0` | — |
| 300 | `#B89F8A` | — |
| 400 | `#A07F68` | — |
| 500 | `#6B5040` | — |
| 600 | `#5A4535` | Lighter hover states, mobile nav backgrounds |
| 700 | `#4A3535` | **Primary border**: card edges, dividers, input borders, table borders |
| 800 | `#3A2A28` | Darker borders, form input backgrounds |
| 900 | `#2A1E1C` | Deepest borders, subtotal dividers |

**Role**: Replaces greeting-purple. Structural lines, card borders, dividers, input borders, hover state backgrounds. Deep warm brown that blends into the dark background.

#### `greeting-teal` — Tertiary Accent
| Shade | Hex | Usage |
|---|---|---|
| 50 | `#E8F5F5` | — |
| 100 | `#C4E8E8` | — |
| 200 | `#96D4D4` | — |
| 300 | `#6BC0C0` | — |
| 400 | `#4A8C8C` | **Tertiary accent**: secondary CTAs, info icons, status badges, floating card accents |
| 500 | `#3A7A7A` | — |
| 600 | `#2E6868` | — |
| 700 | `#245656` | — |
| 800 | `#1A4444` | — |
| 900 | `#103232` | — |

**Role**: Replaces greeting-cyan. Warmer teal for secondary actions, info icons, and status badges. Still readable against dark backgrounds.

#### `greeting-charcoal` — Background / Surfaces
| Shade | Hex | Usage |
|---|---|---|
| 50 | `#F5F2F0` | — |
| 100 | `#E8E4E0` | — |
| 200 | `#D0CAC4` | — |
| 300 | `#B0A898` | — |
| 400 | `#1C1414` | **Primary background**: page bg, section bg, header bg, table headers |
| 500 | `#161010` | **Card surfaces**: dropdown menus, secondary bg, hover states, skeleton shimmer |
| 600 | `#120C0C` | Deeper surfaces, footer bg |
| 700 | `#0E0808` | Deepest surfaces, alert banners |
| 800 | `#0A0606` | Product card image placeholders, darkest bg |
| 900 | `#060404` | Never used directly |

**Role**: Replaces greeting-bg and greeting-dark-purple. Warm espresso-charcoal backgrounds from deep brown-black to very dark brown. Never pure #000.

### Unchanged
- **WhatsApp green** (`bg-emerald-600`): Keep as-is. Brand recognition trumps palette purity.
- **Red for errors**: Keep Tailwind's `red-500` / `red-600` for error text and destructive actions.
- **Amber for warnings**: Keep Tailwind's `amber-600` for stock warnings.

### Rules
- Berry is the single hero accent — teal is subordinate, cocoa is structural.
- No blue, cool-purple, or cyan tones remain in the palette.
- Saturation never exceeds 80%. No neon/outer glow.
- No pure black (#000000) — deepest is charcoal-900 (#060404).
- WhatsApp green is the only green in the system.

## 3. Typography Rules

### Display / Headlines
- **Font:** Playfair Display — loaded via Google Fonts (`index.html`)
- **Tracking:** Tight (-0.02em), weight-driven hierarchy (500 → 700)
- **Scale:** Fluid sizing via `text-3xl sm:text-4xl lg:text-5xl`
- **Max lines:** 3 lines, balanced via `text-wrap: balance`

### Body
- **Font:** Inter — loaded via Google Fonts (`index.html`)
- **Leading:** Relaxed (1.6), max 52ch width
- **Color:** gray-400 (#9CA3AF) for body text, gray-100 (#F3F4F6) for headings

### Mono
- **Font:** Geist Mono — for prices, order IDs, stat values, timestamps
- **Weight:** 600 (semibold) for prices/totals

### Trilingual
- **Sinhala:** Noto Serif Sinhala (serif, 500 weight)
- **Tamil:** Noto Serif Tamil (serif, 500 weight)
- These are the best available serif fonts for their scripts. They pair well with Playfair Display.

### Google Fonts import (index.html)
```
Inter:wght@300;400;500;600;700
Playfair+Display:wght@400;500;600;700
Noto+Serif+Tamil:wght@400;500;700
Noto+Serif+Sinhala:wght@400;500;700
Geist+Mono:wght@400;500;600;700
```

### Banned
- No system-ui fonts for display
- No generic serifs (Times New Roman, Georgia, Garamond)
- No extra font families — the 5 above are the complete set

## 4. Component Stylings

### Buttons
- **Shape:** All buttons → `rounded-full` (pill). No exceptions.
- **Primary (Berry):** Solid berry-500 fill, white text, 8px padding, pill shape. Spring easing, tactile -1px translateY + scale(0.98) on active. Disabled at 50% opacity, no cursor.
- **Ghost:** Transparent bg, berry text on hover. For icon-only or inline actions.
- **WhatsApp:** Emerald fill (#059669). Reserved exclusively for checkout/Cart CTAs. No other button uses green.
- **Outline:** Transparent bg, cocoa border, teal text. For ghost actions.
- **Dark:** Gray-900 fill. For destructive or tertiary actions.

All buttons: spring easing, no neon glow, no custom cursors, consistent 44px minimum tap target.

### Cards
- **Style:** Solid (no glassmorphism, no backdrop-blur)
- **Fill:** `greeting-charcoal-500` (dark warm brown)
- **Border:** `greeting-cocoa-700` (deep warm brown, 1px)
- **Radius:** 12px (`rounded-card`)
- **Shadow:** `shadow-paper` resting → `shadow-paper-md` hover
- **Hover:** translateY(-2px), shadow deepens, border brightens (0.3s spring)
- **Product cards:** 3:4 aspect ratio image, body padding 16px top/bottom, 20px bottom
- **Stat cards:** Charcoal-500 bg, rounded-2xl, monospace values in berry

### Form Inputs
- **Fill:** `greeting-charcoal-600`
- **Border:** `greeting-cocoa-700`
- **Radius:** 10px (keep current for inputs — pill buttons only)
- **Focus:** Berry-400 border + 2px berry ring with 2px offset
- **Hover:** Border brightens to `greeting-cocoa-600`
- **Error state:** Berry border, berry error text below
- **Labels:** Above input (semibold, gray-100)
- **Helper text:** Below (gray-400, 12px)
- No floating labels. Standard gap 1.5rem between fields.

### Badges
- Compact (10px font, uppercase, semibold, tracking-wider). 6px horizontal padding, 4px vertical.
- **Berry** (`badge-berry`): For festive/romantic categories (Birthday, Love, Valentine, Festival)
- **Cocoa** (`badge-cocoa`): For formal/reflective categories (Wedding, Sympathy, Congratulations)
- **Teal** (`badge-teal`): For special categories (Anniversary, Get Well)
- Order status badges: PENDING_WHATSAPP_CONFIRMATION → berry, CONFIRMED → teal, CANCELLED/EXPIRED → cocoa

### Category Pills
- Pill-shaped (10px radius), charcoal-500 bg, cocoa border. Active state: berry fill + white text.
- Spring hover transition to berry border/text. Active = pressed-in feel.
- Category colors mapped to palette: Birthday → berry, Love → berry, Anniversary → teal, Sympathy → cocoa, Festival → berry

### Navigation
- **Header:** Sticky, charcoal-400/80 with backdrop-blur-lg, cocoa-700 bottom border
- **Brand logo:** Lucide Heart (filled, berry-500) + "TwinkleHearts" text (Playfair Display, gray-100, "Hearts" in berry-400)
- **Mobile:** Hamburger expands to full-width animated slide-down menu with cocoa hover backgrounds
- **Footer:** Four-column grid (Brand info, Shop links, Account links, Contact). Charcoal-500 bg, cocoa-700 border.

### Loading States
- **Spinning circles → Pulsing warm-berry heart:** Replace all `animate-spin` border-circle spinners with a Lucide `Heart` icon pulsing with `animate-pulse` in berry-500
- **Skeleton shimmer:** Keep current shimmer system, recolor gradient to charcoal-800 → cocoa-900 → charcoal-800
- **Card skeleton, product grid skeleton, profile skeleton, cart skeleton:** Each matches target dimensions, all recolored to warm palette

### Empty States
- Composed: centered column, circular icon container (teal icon in cocoa-900 bg), title (semibold, gray-100), description (gray-400, max 40ch), optional CTA button (berry, pill)
- Never just "No data" text

### Admin Tables
- Full-width, left-aligned. Cocoa-700 border dividers between rows.
- Header row: charcoal-400 bg, uppercase tracking, gray-400, small.
- Body: gray-300, small. Hover row highlight charcoal-500.
- No card elevation — tables are flat data surfaces.
- Admin pages use the same warm-dark theme as the main site (no white backgrounds)

### Hero Section
- Asymmetric split (left text + right floating card mockups)
- Trilingual stack with Playfair Display for English, Noto Serif for Tamil/Sinhala
- Floating card mockups recolored to warm palette (berry accent cards, teal accent cards, cocoa borders)
- One primary CTA only (berry pill). No bouncing arrows, no chevrons.

### Trilingual Stack
- English line: Playfair Display, gray-100, largest weight
- Tamil line: Noto Serif Tamil, berry-400 for highlight words
- Sinhala line: Noto Serif Sinhala, berry-400 for highlight words
- Each line is a block. Scripts showcase the cultural range.

### Grain Texture
- Keep at 3% opacity SVG turbulence filter on fixed pseudo-element
- Overlays warm-charcoal backgrounds — feels like paper fiber rather than tech noise

### Decorative Elements (Auth pages)
- Floating dots: berry-500 + cream-400 (soft warm particles, not tech-circles)

## 5. Layout Principles

- **Grid-first:** CSS Grid over Flexbox math. Never use `calc()` percentage hacks.
- **Max-width containment:** 1280px centered for page content. Full-width hero allowed.
- **No overlapping elements:** Every element occupies its own clean spatial zone.
- **Section spacing:** `clamp(4rem, 10vw, 8rem)` vertical gaps between sections.
- **Hero:** Asymmetric split (left text, right floating cards). Left-aligned.
- **Feature rows:** Never 3-equal-cards. Use 2-column zig-zag, asymmetric grid, or horizontal scroll.
- **Full-height sections:** Use `min-h-[100dvh]` — never `h-screen` (iOS Safari bug).
- **Bento grids:** For category showcase on home — irregular cell sizes.

### Responsive (Mobile-First, < 768px)
- All multi-column layouts collapse to single column. No exceptions.
- No horizontal scroll on mobile.
- Hero: text stack, floating cards hidden (show on lg only).
- Navigation: horizontal → hamburger slide-down.
- Grids: 4 columns → 2 columns (product grid stays 2 cols on mobile).
- Touch targets: minimum 44px for all interactive elements.
- Typography: headlines scale down via `clamp()`. Body never below 14px.

## 6. Motion & Interaction

- **Spring Physics default:** `cubic-bezier(0.16, 1, 0.3, 1)` — premium, weighty feel.
- **Perpetual Micro-Interactions:**
  - Cart badge: pulse-soft (2s)
  - Product cards: float (6s, staggered)
  - Loading states: pulsing warm-berry heart
  - Shimmer: 2s infinite sweep
- **Staggered Orchestration:** Lists cascade with 60ms delay per item (stagger-1 through stagger-8)
- **Hover States:**
  - Cards: translateY(-2px), shadow deepens, border brightens (0.3s spring)
  - Buttons: micro-scale(1.02) on hover, scale(0.98) + translateY(1px) on active (0.15s)
  - Links: color transition (0.2s spring)
- **Performance:** Animate exclusively via `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`.
- **Entry animations:** fade-up (12px + opacity) for page content, scale-in for modals, stamp for badges.
- **Grain noise:** 3% opacity SVG turbulence filter on fixed pseudo-elements.

## 7. Iconography

### Library
- **Primary:** Lucide React (`lucide-react`) — replaces `@phosphor-icons/react`
- **Custom:** WhatsApp SVG (Lucide doesn't have WhatsApp icon — keep custom SVG)

### Phosphor → Lucide Mapping
| Phosphor | Lucide | Files |
|---|---|---|
| `Heart` | `Heart` | Layout, ProductCard, HomePage |
| `ShoppingCart` | `ShoppingCart` | Layout, ProductCard, HomePage |
| `User` | `User` | Layout |
| `Package` | `Package` | Layout |
| `MapPin` | `MapPin` | Layout |
| `SignOut` | `LogOut` | Layout |
| `List` | `Menu` | Layout |
| `X` | `X` | Layout |
| `CaretDown` | `ChevronDown` | Layout |
| `HeartStraight` | `HeartPulse` | Layout |
| `Sparkle` | `Sparkle` | Layout, HomePage |
| `Gift` | `Gift` | HomePage |
| `Handshake` | `Handshake` | HomePage |
| `Star` | `Star` | HomePage |
| `WhatsappLogo` | Keep custom SVG | HomePage |
| `ArrowRight` | `ArrowRight` | HomePage |

### Weight
- Use `weight="fill"` for prominent icons (Heart in logo, Hero section)
- Use default stroke weight for nav icons, form icons
- Use `strokeWidth={1.5}` for decorative/secondary icons

### Inline SVGs → Lucide
~39 inline SVGs across pages (Admin Dashboard, Cart, Checkout, Login, Register, ProductDetail, Shop, Orders, Wishlist) → replace all with Lucide components.

## 8. Page-Specific Compositions

### HomePage (/)
| Section | Layout | Elements |
|---------|--------|----------|
| **Hero** | Asymmetric split (left text + right floating cards) | Trilingual stack (Playfair Display), 1× primary CTA (berry pill), 3 floating card mockups recolored to warm palette |
| **Categories** | Bento grid (2+1+2 cell asymmetry) | Category cards with Lucide icons + name + cocoa border |
| **Featured Products** | ProductCard grid (4 cols desktop) | ProductCard with Lucide icons, warm palette, berry hover |
| **About + Stats** | Split: stat grid left, blurb right | 4 stat-cards (2×2), brand story paragraph |
| **CTA** | Full-width, centered column | Heading + text + 1× CTA button (berry pill) |

### ShopPage (/shop)
- **Filter bar:** Horizontally scrollable category pills. Active pill = berry fill.
- **Product grid:** 4-column desktop, 2-column mobile.
- **Empty state:** "No cards found" with illustration icon + clear-filters CTA.

### ProductDetailPage (/product/:id)
- **Breadcrumb:** Home → Shop → Product Name (small, gray-400)
- **Image:** Main image (3:4) left, no thumbnail strip.
- **Details right:** Product name (h1, Playfair Display), price (berry, mono, large), category badge, description, stock indicator, quantity selector, Add to Cart button (berry, pill), WhatsApp inquiry link.
- **Loading:** ProductSkeleton recolored.
- **Error:** Error state with "Product not found" + back button.

### CartPage (/cart)
- **Gift-receipt design:** Items listed with image thumbnail, name, unit price, qty control, line total. Remove button (berry ghost).
- **Order summary sidebar:** Subtotal, 18% VAT, "Free Shipping", ink-divider, total (large, mono, berry), WhatsApp Checkout button (green pill).
- **Empty cart:** EmptyState with cart icon + "Your cart is empty" + Shop link.

### CheckoutPage (/checkout)
- **Form column left:** Name (full), phone (country code dropdown + number).
- **Order summary right:** Compact item list, subtotal, tax, total, WhatsApp Checkout button (green pill).
- **Submit:** "Send via WhatsApp" button (green pill).
- **Validation errors:** Inline per-field berry error text.

### OrderSuccessPage (/order-success/:id)
- **Hero icon:** Large berry check or stamp animation.
- **Receipt card:** Order ID (mono), date, item list, totals.
- **Guidance:** "Next step: Open WhatsApp" + large WhatsApp button.
- **Next Steps card:** Charcoal-700 bg, cocoa-700 border.

### LoginPage (/login)
- **Centered card:** Logo at top, email input, password input, "Remember me" checkbox, Sign In button (berry pill), divider "or", Google OAuth button, "Register" link.
- **Decorative dots:** berry-500 + cream-400 (warm particles, not tech-circles).

### RegisterPage (/register)
- **Centered card:** Name, email, phone, password + strength bar, confirm password, Create Account button (berry pill), "Login" link.
- **Decorative dots:** berry-500 + cream-400.

### ProfilePage (/profile)
- **Card layout:** Avatar upload, name, phone, email (read-only), role badge, Save button (berry pill).
- **Loading:** ProfileSkeleton recolored.

### OrderHistoryPage (/orders)
- **List of order cards:** Order ID (truncated, mono), date, item count, total (berry, mono), status badge.
- **Empty:** EmptyState with receipt icon.

### AddressManagementPage (/addresses)
- **Address cards:** Label badge, phone, full address, default badge, Edit/Delete buttons. Add Address button (teal outline).
- **Default indicator:** `ring-2 ring-greeting-berry-500` (replaces old magenta)

### WishlistPage (/wishlist)
- **Product grid:** Same ProductCard grid. Remove from wishlist button (berry ghost heart icon).
- **Heart icon color:** `text-rose-400` → keep or map to berry-400 for consistency.

### AdminDashboardPage (/admin)
- **Stats row:** 4 stat-cards — each with Lucide icon, large mono value, label. Charcoal cards, cocoa border.
- **Pending orders alert:** Charcoal-700 bg, cocoa-700 border, teal icon.
- **Quick actions:** Row of Lucide icons + label links in charcoal cards.
- **Recent orders:** Charcoal card, cocoa dividers, berry status badges.

### AdminOrdersPage (/admin/orders)
- **Full admin table:** Same warm-dark styling as main site. Cocoa dividers, charcoal hover.

### AdminProductsPage (/admin/products)
- **Table:** Same warm-dark styling. "Add Product" button → berry pill.
- **Create/Edit form:** Same warm-dark inputs. Save → berry pill.

### AdminUsersPage (/admin/users)
- **Table:** Same warm-dark styling.

## 9. Anti-Patterns (Banned)

- No emojis anywhere in UI (except ShopPage category pills which use emojis — keep for playful feel)
- No pure black (#000000) — deepest is charcoal-900 (#060404)
- No neon/outer glow shadows — use diffused shadow-paper family
- No oversaturated accents — maximum 80% saturation
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — clean spatial separation always
- No 3-column equal card layouts — use asymmetric
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash")
- No broken image links — use R2 or placeholder SVGs
- No centered Hero sections — asymmetric or left-aligned only
- No generic placeholder names ("John Doe", "Acme")
- No fake round numbers ("99.99%", "50%")
- No floating labels in forms — labels always above input
- No cool-purple, blue, or cyan tones anywhere in the palette
- No glassmorphism / backdrop-blur on cards (header blur is OK)

## 10. Implementation Plan

### Phase 1: Config & Fonts
1. `package.json`: `@phosphor-icons/react` → `lucide-react`
2. `index.html`: Add Playfair Display to Google Fonts link
3. `tailwind.config.js`: Rewrite 5 color scales (berry, cocoa, teal, charcoal, keep existing gray)

### Phase 2: Global CSS
4. `index.css`: Update all component classes (~50 defs):
   - `.card`, `.card-white`: charcoal-500 bg, cocoa-700 border, remove backdrop-filter
   - `.btn-*`: `rounded-full`, berry-500 primary
   - `.input-field`: charcoal-600 bg, cocoa-700 border, berry-400 focus
   - `.badge-*`: berry, cocoa, teal variants
   - `.category-pill`: charcoal-500 bg, cocoa border, berry active
   - `.skeleton-shimmer`: charcoal-800 → cocoa-900 gradient
   - `.empty-state-icon`: cocoa-900 bg, teal icon
   - `.section-eyebrow`: berry-900 bg, berry-300 text
   - `.admin-table`: cocoa dividers
   - `.stat-card`: charcoal-500 bg, cocoa border
   - `.feature-icon`: berry-500/20 bg, berry-400 icon
   - `.cta-section`: charcoal-700 bg
   - `.trilingual-line-*`: Playfair Display for English
   - `.grain`: Keep as-is (blends with warm tones naturally)

### Phase 3: Find-and-Replace (~249 references)
5. Project-wide Tailwind class rename:
   - `greeting-magenta-*` → `greeting-berry-*`
   - `greeting-purple-*` → `greeting-cocoa-*`
   - `greeting-cyan-*` → `greeting-teal-*`
   - `greeting-bg-*` → `greeting-charcoal-*`
   - `greeting-dark-purple-*` → `greeting-charcoal-*`
   - `greeting-pink-*` → `greeting-berry-*`

### Phase 4: Icon Migration
6. Swap Phosphor → Lucide in 3 files (Layout.tsx, ProductCard.tsx, HomePage.tsx)
7. Replace 4 custom SVG components (HeartIcon, WhatsAppIcon, HeartSparkle, CartIcon)
8. Replace ~39 inline SVGs across 10+ page files
9. Keep WhatsApp custom SVG

### Phase 5: Animation Updates
10. Replace 3 spinner references (AdminDashboard, AddressPage, ImageUpload) with pulsing Lucide Heart
11. Add subtle sway to product card `whileHover`

### Phase 6: Misc Updates
12. `rounded-[10px]` → `rounded-full` (5 refs in HomePage, 1 in ErrorBoundary)
13. `::selection` → berry-400 (in index.css)
14. `:focus-visible` → berry-400 ring
15. Logo text font → Playfair Display (Layout.tsx)

### Scope Summary
| Category | Files | Changes |
|---|---|---|
| Config | 3 | tailwind.config.js, package.json, index.html |
| CSS | 1 | index.css (~50 class defs) |
| Components | ~6 | Layout.tsx, ProductCard.tsx, ErrorBoundary.tsx, EmptyState.tsx, LoadingSkeleton.tsx, Icons.tsx, CartIcon.tsx, ImageUpload.tsx |
| Pages | ~14 | Home, Shop, Cart, Checkout, OrderSuccess, ProductDetail, Login, Register, Profile, Orders, Address, Wishlist, Admin/* |
| **Total** | **~24 files** | ~249 color class replacements + icon migration + font swap |
