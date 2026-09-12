# Rangoli Service Page — Basics Design Spec (2026-09-12)

Branch: `rangoli-page` (main stays prod-clean until finalize).

## 1. Context

Rangoli is a **service, not a product**. Customers browse rangoli *designs*,
purchase one, and a real person visits their home to draw it. Booking needs
**design only** — date, time, and address are arranged over a WhatsApp call
after the order lands. Therefore the existing WhatsApp order pipeline
(cart → server-validated order → `wa.me` link → owner calls back) handles
Rangoli end-to-end with **zero backend changes**: a design is a `Product`
with `category='rangoli'`, price = service fee.

Inspiration (scraped 2026-09-12): islandrangoli.com (campaign hero banners,
category tiles, product rails, "why us" trust strip, photo reviews) and
lovenspire.com/collections/rangoli-collection (trust strip, educational
sections, FAQ accordion, reviews).

## 2. Scope — basics only (this spec)

ON `/rangoli`: festive hero, design gallery with Book buttons,
how-it-works (3 steps), occasions.
ON `/product/:id` (only when `category==='rangoli'`): service layout touch.
Backend: none. Admin seed of designs: later (empty state meanwhile).

Explicitly OUT: FAQ, reviews, rails splitting (no metadata to split on yet),
slot scheduling, artist assignment, separate booking model.

## 3. `/rangoli` blueprint

1. **Festive hero** — Diwali-toned banner, one H1 ("Rangoli Collection"),
   subtext ≤ 20 words, single CTA "Browse designs" anchoring to gallery.
   No search bar (gallery, not catalog).
2. **Design gallery** — grid of `category='rangoli'` products via existing
   `ProductCard`; explicit **Book this design** pill per card → `addItem`
   (qty 1) + navigate to `/cart`. Count line ("N designs"). Empty state:
   "No Rangoli cards yet" + link to `/shop`.
3. **How it works** — 3 steps: Pick your design → Book in one tap →
   Artist arrives and draws.
4. **Occasions** — Diwali, Weddings, Pooja, Housewarming; static cards
   anchoring back to the gallery.

## 4. Detail-page service rules (`ProductDetailPage`, rangoli only)

- Breadcrumb root links to `/rangoli` (label Rangoli), not `/shop`.
- Stock line replaced with service-availability line ("Artist visit —
  arranged over WhatsApp after booking").
- Quantity stepper hidden; bookings are always quantity 1.
- CTA label "Book this design" / booked-state "Added — continue to cart".
- "Perfect for" list gains a `rangoli` entry (Diwali, weddings, pooja,
  housewarmings) instead of the generic list.
- Spec row "Delivery: Free via WhatsApp delivery" becomes
  "Service: Our artist draws it at your home".
- Related-designs rail works unchanged (same-category fetch).

## 5. Copy deck (locked for v1)

- Hero eyebrow: "Festival special"; subtext:
  "Pick a design, book in one tap — our artist draws it at your home."
- Steps: as §3.3. No emojis in UI copy except the 🪔 hero marker (festive intent).

## 6. Testing

- Extend `RangoliPage.test.tsx`: category fetch, hero H1, empty state
  (existing) + Book button per design calls `addItem` with qty 1,
  3 steps, 4 occasions render.
- New `ProductDetailPage.rangoli.test.tsx`: Book CTA, no quantity
  stepper, artist-visit copy for `category='rangoli'`; control case
  (birthday) keeps Add to Cart + stepper.
- Gates: `typecheck --workspace=frontend` clean; frontend suite green.
  Backend typecheck failures are pre-existing (verified via stash).
