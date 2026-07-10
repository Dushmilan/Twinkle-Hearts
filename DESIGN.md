# Design System: Twinkle-Hearts

## 1. Visual Theme & Atmosphere

A nocturnal greeting-card atelier with neon-boutique sensibility. Deep purple-black backgrounds create a velvet-night canvas, while singular magenta-cyan accents strike like ink on luxury paper. Gallery-airy density (3/10) with confident asymmetric layouts (variance 8/10) and fluid spring motion (motion 6/10). The atmosphere sits between a Riso-printed zine and a Tokyo night-market stall — intimate, tactile, glowing in the dark.

## 2. Color Palette & Roles

- **Midnight Canvas** (#1A1A2E) — Primary page background
- **Deep Ink** (#121222) — Sheet/section surfaces, container fills
- **Velvet Card** (#2D1B4E) — Card and elevated surface fill
- **Snow White** (#F3F4F6) — Primary text, headings
- **Warm Ash** (#D1D5DB) — Body text, descriptions
- **Muted Pewter** (#9CA3AF) — Secondary text, metadata, placeholders
- **Neon Magenta** (#D6368E) — Singular accent for CTAs, active states, prices, badges, focus rings, link hovers
- **Signal Cyan** (#00D4FF) — Secondary accent for ghost buttons, info icons, subtle highlights
- **Purple Border** (#6B2C91) — Structural lines, card borders, dividers, input borders
- **Off-Black** (#0E0E1C) — Footer, darkest surfaces (never pure #000)

**Rules**: Saturation never exceeds 80%. No purple/blue neon gradients. Magenta is the single hero accent — cyan is subordinate.

## 3. Typography Rules

- **Display / Headlines:** Satoshi — Track-tight (-0.03em), weight-driven hierarchy (medium→bold). Controlled scale — never scream through size alone. Headlines max 3 lines, balanced via `text-wrap: balance`.
- **Body:** Satoshi — Relaxed leading (1.6), max 65ch width, Warm Ash (#D1D5DB) color. Pure white reserved for headings only.
- **Mono:** Geist Mono — For prices, order IDs, timestamps, stat values, admin table numbers. Bold variant for totals.
- **Trilingual:** Noto Serif Tamil + Noto Serif Sinhala — For Tamil/Sinhala hero lines and category labels.
- **Scaling:** All headlines use `clamp()` for fluid sizing. Body minimum 1rem (14px on mobile).
- **Banned:** Inter, system-ui fonts for display. Generic serifs (Times New Roman, Georgia, Garamond) everywhere. Serif fonts in admin/dashboard contexts.

## 4. Component Stylings

### Buttons
- **Primary (Magenta):** Flat fill, 10px radius, tactile -1px translateY + scale(0.98) on active. No outer glow. Shadow-paper resting state. Disabled at 50% opacity, no cursor.
- **Secondary (Cyan):** Cyan fill, darkens on hover. For secondary actions (e.g., "Browse Shop").
- **Outline:** Transparent bg, purple border, cyan text. For ghost actions, filter pills.
- **WhatsApp:** Emerald fill (#059669). Reserved exclusively for checkout/Cart CTAs. No other button uses green.
- **Dark:** Gray-900 fill. For destructive or tertiary actions.
- **Ghost:** Transparent bg, magenta text on hover. For icon-only or inline actions.

All buttons: spring easing, no neon glow, no custom cursors, consistent 44px minimum tap target.

### Cards
- Generously rounded corners (12px / `rounded-card`). Dark purple fill (#2D1B4E) with purple border (#6B2C91).
- Shadow elevates hierarchy: `shadow-paper` resting → `shadow-paper-md` hover.
- Used ONLY when elevation communicates hierarchy. For high-density lists (admin tables, order history), replace cards with border-top dividers and row backgrounds.
- Product cards: 3:4 aspect ratio image, body padding 16px top/bottom, 20px bottom. Spring hover (translateY(-2px)).
- Stat cards: Dark purple fill, rounded-2xl, monospace values in magenta.

### Form Inputs
- Dark fill (#121222), purple border (#6B2C91), 10px radius. Magenta focus ring (2px, offset).
- Label above input (semibold, white), helper text below (gray-400, 12px), error below in magenta (12px).
- No floating labels. Standard gap 1.5rem between fields.
- Phone input: Country code dropdown + phone field side by side.
- File upload: Drag-to-click zone with border, thumbnails with reorder/reveal/remove tools.

### Navigation
- **Header:** Sticky, glass-effect backdrop (bg with blur). Brand logo left, Shop link + Cart icon (with animated badge count) right. User dropdown (Profile, Orders, Addresses, Wishlist, Admin divider, Logout).
- **Mobile:** Hamburger expands to full-width animated slide-down menu. Bottom CTA for sign-in/sign-up.
- **Footer:** Four-column grid (Brand info, Shop links, Account links, Contact). Grain overlay at low opacity.

### Loaders / Skeleton
- Skeletal shimmer matching exact layout dimensions — never circular spinners.
- Shimmer gradient: dark-purple-800 → purple-900 → dark-purple-800, 2s infinite.
- Card skeleton, product grid skeleton, profile skeleton, cart skeleton — each matches target dimensions.

### Empty States
- Composed compositions: centered column, circular icon container (cyan icon in purple-900 bg), title (semibold, white), description (gray-400, max 40ch), optional CTA button.
- Never just "No data" text.

### Badges
- Compact (10px font, uppercase, semibold, tracking-wider). 6px horizontal padding, 4px vertical.
- Magenta variant for status, Cyan variant for info, Gray variant for neutral, Purple variant for secondary tags.
- Order status badges: PENDING_WHATSAPP_CONFIRMATION → magenta, CONFIRMED → cyan, CANCELLED/EXPIRED → purple.

### Category Pills
- Pill-shaped (10px radius), dark bg (#121222), purple border. Active state: magenta fill + white text.
- Spring hover transition to magenta border/text. Active = pressed-in feel.

### Admin Tables
- Full-width, left-aligned. Purple border dividers between rows (#6B2C91 header, #2D1B4E body).
- Header row: uppercase tracking, gray-400, small. Body: gray-300, small.
- Hover row highlight (#2D1B4E). No card elevation — tables are flat data surfaces.

### Hero Section
- Asymmetric split (never centered — variance 8/10). Left-aligned headline stack with inline image typography: small contextual card photos embedded between or within words at type-height, rounded.
- Trilingual lines stack vertically (English → Tamil → Sinhala).
- One primary CTA only (magenta). No "Scroll to explore", no bouncing arrows, no chevrons.

### Trilingual Stack
- English line: Satoshi, white, largest weight.
- Tamil line: Noto Serif Tamil, purple-200.
- Sinhala line: Noto Serif Sinhala, purple-200.
- Each line is a block. Scripts showcase the cultural range.

## 5. Layout Principles

- **Grid-first:** CSS Grid over Flexbox math. Never use `calc()` percentage hacks.
- **Max-width containment:** 1280px centered for page content. Full-width hero allowed.
- **No overlapping elements:** Every element occupies its own clean spatial zone. No absolute-positioned stacking.
- **Section spacing:** `clamp(4rem, 10vw, 8rem)` vertical gaps between sections.
- **Hero:** Asymmetric split (60/40 or asymmetric whitespace). Left-aligned text, right-aligned card-grid or single hero image.
- **Feature rows:** Never 3-equal-cards. Use 2-column zig-zag, asymmetric grid (2/3 + 1/3), or horizontal scroll with peek.
- **Full-height sections:** Use `min-h-[100dvh]` — never `h-screen` (iOS Safari bug).
- **Bento grids:** For category showcase on home — irregular cell sizes, not uniform tiles.
- **Admin layout:** Sidebar-style or top bar with content area. Cardless tables.

### Responsive (Mobile-First, < 768px)
- All multi-column layouts collapse to single column. No exceptions.
- No horizontal scroll on mobile.
- Hero: text stack, inline images wrap below headline.
- Navigation: horizontal → hamburger slide-down.
- Grids: 2 columns → 1 column. Product grid: 2 columns → 2 columns (cards shrink).
- Touch targets: minimum 44px for all interactive elements.
- Typography: headlines scale down via `clamp()`. Body never below 14px.

## 6. Motion & Interaction

- **Spring Physics default:** `cubic-bezier(0.16, 1, 0.3, 1)` — premium, weighty feel. No linear easing.
- **Perpetual Micro-Interactions:** Every active component has an infinite loop state:
  - Cart badge: pulse-soft (2s)
  - Product cards: float (6s, staggered)
  - Stat values: breathe (3s) on hover
  - Loading shimmer: 2s infinite sweep
- **Staggered Orchestration:** Lists never mount instantly. Cascade delays (60ms per item via .stagger-1 through .stagger-8 classes).
- **Hover States:**
  - Cards: translateY(-2px), shadow deepens, border brightens (0.3s spring)
  - Buttons: micro-scale(1.02) on hover, scale(0.98) + translateY(1px) on active (0.15s)
  - Links: color transition (0.2s spring)
- **Performance:** Animate exclusively via `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`.
- **Entry animations:** fade-up (12px + opacity) for page content, scale-in for modals, stamp for badges.
- **Grain noise:** 3% opacity SVG turbulence filter on fixed pseudo-elements (footer, hero background). Never on interactive content.

## 7. Page-Specific Compositions

### HomePage (/)
| Section | Layout | Elements |
|---------|--------|----------|
| **Hero** | Asymmetric split (left text + right category bento) | Trilingual stack, inline card photos in text, 1× primary CTA, bento grid of 4 category links (irregular cells) |
| **Categories** | Bento grid (2+1+2 cell asymmetry) | Category cards with icon + name + gradient overlay |
| **Featured Products** | Horizontal scroll with peek + 2-row grid | ProductCard row (scrollable, next-item peeking), then 2-column grid below |
| **About + Stats** | Split: stat grid left, blurb right | 4 stat-cards (2×2), brand story paragraph |
| **CTA** | Full-width, centered column | Heading + text + 1× CTA button (WhatsApp or Shop) |

### ShopPage (/shop)
- **Filter bar:** Horizontally scrollable category pills. Active pill = magenta fill. Search input in top-right.
- **Product grid:** 4-column desktop, 2-column tablet, 2-column mobile. ProductCard in each cell.
- **Empty state:** "No cards found" with illustration icon + clear-filters CTA.

### ProductDetailPage (/product/:id)
- **Breadcrumb:** Home → Shop → Product Name (small, gray-400, with chevrons)
- **Image gallery:** Main image (3:4) left, thumbnail strip below. Click to swap.
- **Details right:** Product name (h1), price (magenta, mono, large), category badge, description, stock indicator (green dot = in stock, gray = low, red = sold out), quantity selector (+/− with number), Add to Cart button (magenta, full-width), WhatsApp inquiry link (cyan, ghost).
- **Loading:** ProductSkeleton (image placeholder + 3 shimmer lines).
- **Error:** Error state with "Product not found" + back button.

### CartPage (/cart)
- **Gift-receipt design:** Items listed with image thumbnail, name, unit price, qty control (+/−), line total. Remove button (magenta ghost).
- **Order summary sidebar:** Subtotal, 18% VAT line, "Free Shipping" badge, ink-divider, total (large, mono, magenta), WhatsApp Checkout button (green, full-width).
- **Empty cart:** EmptyState with cart icon + "Your cart is empty" + Shop link.
- **Loading:** CartSkeleton (3 items with image placeholders).

### CheckoutPage (/checkout)
- **Form column left:** Name (full), phone (country code dropdown + number), optional notes textarea.
- **Order summary right:** Compact item list (name × qty = line total), subtotal, tax, total, terms checkbox.
- **Submit:** "Send via WhatsApp" button (green, full-width). Creates order, gets wa.me link, redirects.
- **Validation errors:** Inline per-field magenta error text.

### OrderSuccessPage (/order-success/:id)
- **Hero icon:** Large green check or stamp animation.
- **Receipt card:** Order ID (mono, copyable), date, item list, customer name, phone, subtotal, tax, total (mono, bold, magenta).
- **Guidance:** "Next step: Open WhatsApp" instruction + large WhatsApp button. Smaller "View order history" link.
- **Auto-redirect:** If wa.me link available, show it prominently.

### LoginPage (/login)
- **Centered card:** Logo at top, email input, password input (with show/hide toggle), "Remember me" checkbox, "Forgot password?" link, Sign In button (magenta, full-width), divider "or", Google OAuth button (outline with Google logo), "Don't have an account? Register" link.
- **Error state:** Invalid credentials toast + field-level errors.
- **Loading:** Button shows spinner, inputs disabled.

### RegisterPage (/register)
- **Centered card:** Name (full), email, phone (+94 prefix), password + strength bar (4 segments: weak→strong), confirm password, Create Account button (magenta), "Already have an account? Login" link.
- **Validation:** Real-time strength indicator, match check on confirm, format validation on blur.

### ProfilePage (/profile)
- **Card layout:** Avatar upload (circular, 80px), name (editable input), phone (editable), email (read-only, gray), role badge, member-since date, Save button (magenta).
- **Loading:** ProfileSkeleton (avatar circle + 3 lines + 3 field blocks).

### OrderHistoryPage (/orders)
- **List of order cards:** Order ID (truncated, mono), date, item count (e.g. "3 items"), total (magenta, mono), status badge. Click to expand or link to /order-success/:id.
- **Empty:** EmptyState with receipt icon.
- **Loading:** OrderSkeleton cards.

### AddressManagementPage (/addresses)
- **Address cards:** Label badge (e.g. "HOME"), phone, full address, default badge, Edit/Delete buttons. Add Address button (cyan outline, top-right).
- **Add/Edit form:** Inline or modal — label input, phone, street, city, state, zip (LK only, country fixed).
- **Empty:** EmptyState with map-pin icon + "Add your first address" CTA.
- **Toast feedback** on create/update/delete.

### WishlistPage (/wishlist)
- **Product grid:** Same ProductCard grid as Shop. Remove from wishlist button (magenta ghost heart icon on card).
- **Unauthenticated:** EmptyState with heart icon + "Login to save your favorites" + Login CTA.
- **Empty (authenticated):** EmptyState with heart icon + "Your wishlist is empty" + Shop CTA.

### AdminDashboardPage (/admin)
- **Stats row:** 4 stat-cards (Total Orders, Revenue LKR, Total Users, Active Products) — each with icon, large mono value, label.
- **Pending orders alert:** Full-width amber/cyan banner if orders with PENDING_WHATSAPP_CONFIRMATION exist.
- **Quick actions:** Row of icon+label links (Manage Orders, Manage Products, Manage Users).
- **Recent orders:** Compact table of last 5 orders (ID, customer, total, status, date).

### AdminOrdersPage (/admin/orders)
- **Full admin table:** Order ID (mono, link), Customer name, Item count, Total (mono), Status badge, Date, Actions dropdown.
- **Pagination:** Page numbers at bottom.
- **Filter:** Status dropdown filter + date range optional.

### AdminProductsPage (/admin/products)
- **Table:** Image thumbnail, Name, Category badge, Price (mono), Stock count, Status toggle (Active/Inactive switch), Actions (Edit/Delete).
- **Top bar:** Add Product button (magenta) + Search input.
- **Create/Edit form:** Name, Description (textarea), Price, Stock, Category dropdown, Image Upload component, Active toggle. Save/Cancel buttons.
- **ImageUpload:** Drag zone, preview carousel with reorder arrows, "Primary" badge, "New" badge, remove overlay. Validated for type (image/*) and size (max 5MB).

### AdminUsersPage (/admin/users)
- **Table:** Name, Email, Phone, Role dropdown (CUSTOMER / ADMIN), Orders count, Addresses count, Wishlist count, Joined date.
- **Search:** Filter by name or email.
- **Pagination:** Page numbers.

## 8. Anti-Patterns (Banned)

- No emojis anywhere in UI
- No Inter font — use Satoshi + Geist Mono
- No generic serif (Times New Roman, Georgia, Garamond)
- No pure black (#000000) — deepest is Off-Black (#0E0E1C)
- No neon/outer glow shadows — use diffused shadow-paper family
- No oversaturated accents — maximum 80% saturation
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — clean spatial separation always
- No 3-column equal card layouts — use 2-column zig-zag, asymmetric, or scroll
- No generic placeholder names ("John Doe", "Acme", "Nexus")
- No fake round numbers ("99.99%", "50%")
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionary")
- No filler UI: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- No broken Unsplash links — use R2 or picsum.photos
- No centered Hero sections — asymmetric or left-aligned only
- No circular loading spinners — use skeletal shimmer matching layout
- No floating labels in forms — labels always above input
