# Twinkle-Hearts Architecture Deepening Plan

> **Generated:** July 10, 2026 | **Graphify commit:** e12c8423 | **8 candidates identified**

---

## Executive Summary

The codebase has **3 god nodes** (`getPrisma` 46 edges, `useCartStore` 18 edges, `Api` 17 edges) and **4 low-cohesion communities** (cohesion 0.04–0.08). Applying the **deletion test** reveals 8 deepening candidates where extracting a seam would concentrate complexity rather than disperse it.

| # | Candidate | Strength | Target Seam |
|---|-----------|----------|-------------|
| 1 | `getPrisma()` → `PrismaRepository` | **Strong** | DB access |
| 2 | `cache.ts` → `CacheRepository` | **Worth exploring** | KV caching |
| 3 | `authService` → Auth domain modules | **Worth exploring** | Auth lifecycle |
| 4 | `orderService` → Order Intake Module | **Strong** | Checkout flow |
| 5 | `useCartStore` → Composed cart stores | **Strong** | Frontend cart |
| 6 | `api.ts` → Domain API clients + `HttpClient` | **Worth exploring** | Frontend→Backend |
| 7 | `shared` → Domain-aligned packages | **Speculative** | Cross-cutting types |
| 8 | Validation middleware ↔ service | **Worth exploring** | Product validation |

---

## Phase 0: Test Infrastructure & Context (1–2 days)

**Goal:** Establish test doubles for all seams; update `CONTEXT.md` with new domain terms.

### 0.1 Test Repository Helpers
```
backend/tests/helpers/
├── repositories.ts           # TestPrismaRepository, TestCacheRepository
├── test-factories.ts         # createTestProduct, createTestOrder, etc.
└── http-client.ts            # TestHttpClient for frontend
```

### 0.2 Domain Terms for CONTEXT.md
- **Order Intake Module** — facade orchestrating pricing, stock, persistence, WhatsApp formatting
- **Pricing Engine** — pure subtotal + 18% VAT + rounding (LKR)
- **Stock Reservation** — atomic check-and-decrement via `updateMany`
- **Cache Repository** — domain-specific KV operations (session, orders, products, rate-lists, products)
- **Product Validator** — validates cart items against DB, returns `ValidatedItem[]`
- **HttpClient** — interface for fetch + auth interceptor (frontend)

---

## Phase 1: Prisma Repository Seam (Candidate 1) — Week 1

**Goal:** Replace `getPrisma(): PrismaClient` with `getPrisma(db): PrismaRepository`

### 1.1 Create Repository Interface
```
backend/src/lib/repositories/
├── index.ts
├── prisma-repository.ts      # interface PrismaRepository
├── d1-prisma-repository.ts   # production: wraps PrismaClient
├── test-prisma-repository.ts # in-memory / SQLite for tests
└── README.md
```

**`PrismaRepository` interface:**
```typescript
interface PrismaRepository {
  user: UserDelegate;
  product: ProductDelegate;
  order: OrderDelegate;
  session: SessionDelegate;
  address: AddressDelegate;
  wishlist: WishlistDelegate;
  $transaction: <T>(fn: (tx: PrismaTransactionClient) => Promise<T>) => Promise<T>;
}
```

### 1.2 Wire Production Adapter
```typescript
// backend/src/lib/repositories/d1-prisma-repository.ts
export function createD1PrismaRepository(db: D1Database): PrismaRepository {
  const adapter = new PrismaD1(db);
  const client = new PrismaClient({ adapter });
  return {
    user: client.user,
    product: client.product,
    order: client.order,
    session: client.session,
    address: client.address,
    wishlist: client.wishlist,
    $transaction: client.$transaction.bind(client),
  };
}
```

### 1.3 Migrate All Callers (15+)
| Service | Change |
|---------|--------|
| `authService` | `getPrisma(env.DB)` → `createD1PrismaRepository(env.DB)` |
| `orderService`/`OrderIntakeFacade` | same |
| `productService` | same |
| `userService` | same |
| `adminService` | same |
| `middleware/auth.ts` | same |
| `middleware/validation.ts` | same |

### 1.4 Update `getPrisma` Factory
```typescript
// backend/src/lib/prisma.ts (backward compat during transition)
export function getPrisma(db: D1Database): PrismaClient {
  // DEPRECATED: use createD1PrismaRepository instead
  return createD1PrismaRepository(db).client; // if needed for gradual migration
}
```

### 1.5 Tests
- Unit: `TestPrismaRepository` with in-memory maps
- Integration: services against local D1
- Verify: `npm run typecheck && npm run test --workspace=backend`

---

## Phase 2: Order Intake Module (Candidate 4) — Week 2

**Goal:** Decompose `orderService` into focused modules behind `OrderIntakeFacade`

### 2.1 New Module Structure
```
backend/src/modules/order-intake/
├── index.ts
├── pricing-engine.ts           # pure: subtotal + 18% VAT + rounding
├── stock-reservation.ts        # atomic check-and-decrement
├── order-persister.ts          # create order + items + priceSnapshot
├── whatsapp-formatter.ts       # message template (from orderRoutes)
├── order-intake-facade.ts      # orchestrates all above
├── order-query-repository.ts   # read path: getById, getUserOrders
└── types.ts
```

### 2.2 Module Contracts

**`PricingEngine`** (pure, no deps):
```typescript
interface PricingEngine {
  calculate(input: { items: ValidatedItem[]; taxRate: number }): OrderPricing;
}
```

**`StockReservation`** (needs `PrismaRepository`):
```typescript
interface StockReservation {
  reserve(items: ValidatedItem[], repo: PrismaRepository): Promise<void>;
  // Uses repo.product.updateMany({ where: { id, stock: { gte: qty }}, data: { stock: { decrement: qty }}})
}
```

**`OrderPersister`** (needs `PrismaRepository` + `CacheRepository`):
```typescript
interface OrderPersister {
  create(input: OrderInput, repo: PrismaRepository, cache: CacheRepository): Promise<Order>;
}
```

**`WhatsAppFormatter`** (pure):
```typescript
interface WhatsAppFormatter {
  format(order: Order, businessNumber: string): string; // returns wa.me deep link
}
```

**`OrderIntakeFacade`** (orchestrator):
```typescript
interface OrderIntakeFacade {
  createOrder(input: CreateOrderInput, ctx: {
    repo: PrismaRepository;
    cache: CacheRepository;
    pricing: PricingEngine;
    stock: StockReservation;
    formatter: WhatsAppFormatter;
    whatsappNumber: string;
  }): Promise<{ order: Order; whatsappDeepLink: string }>;
}
```

**`OrderQueryRepository`** (read path):
```typescript
interface OrderQueryRepository {
  getById(orderId: string, userId: string, repo: PrismaRepository, cache: CacheRepository): Promise<Order | null>;
  getUserOrders(userId: string, page: number, limit: number, repo: PrismaRepository, cache: CacheRepository): Promise<PaginatedOrders>;
}
```

### 2.3 Wire Into Routes
- `orderRoutes.ts` constructs facade with production adapters
- Returns `{ orderId, items, subtotal, tax, total, whatsappDeepLink, createdAt }`
- **No business logic in routes** — only HTTP handling

### 2.4 Tests
- Unit: `PricingEngine` (100% coverage, no mocks)
- Unit: `WhatsAppFormatter`
- Unit: `StockReservation` with `TestPrismaRepository`
- Unit: `OrderIntakeFacade` with all test adapters
- Integration: full flow against local D1

### 2.5 Verification
- [ ] `npm run typecheck` passes
- [ ] `npm run test --workspace=backend` passes
- [ ] Order creation works end-to-end
- [ ] `orderRoutes.ts` contains only HTTP logic

---

## Phase 3: Cache Repository + Validation Seam (Candidates 2, 8) — Week 3

### 3.1 Cache Repository
```
backend/src/lib/cache/
├── index.ts
├── cache-repository.ts         # interface CacheRepository
├── kv-cache-repository.ts      # production (wraps cacheWrap, CacheKeys, CACHE_TTL)
├── test-cache-repository.ts    # Map-based
├── cache.ts                    # DEPRECATED barrel
└── README.md
```

**`CacheRepository` interface:**
```typescript
interface CacheRepository {
  // Sessions
  getSession(sessionId: string): Promise<SessionData | null>;
  setSession(sessionId: string, data: SessionData, ttl?: number): Promise<void>;
  invalidateSession(sessionId: string): Promise<void>;

  // User data
  getUserOrders(userId: string): Promise<PaginatedOrders | null>;
  setUserOrders(userId: string, data: PaginatedOrders, ttl?: number): Promise<void>;
  invalidateUserOrders(userId: string): Promise<void>;
  invalidateUserData(userId: string): Promise<void>; // batch invalidation

  // Products
  getProductCatalog(key: string): Promise<any>;
  setProductCatalog(key: string, data: any, ttl?: number): Promise<void>;
  invalidateProducts(): Promise<void>;

  // Rate limiting
  checkRateLimit(identifier: string, max: number, ttl: number): Promise<boolean>;
}
```

### 3.2 Migrate Callers (10+)
| Caller | New Methods |
|--------|-------------|
| `authService` | `getSession`, `setSession`, `invalidateSession` |
| `OrderQueryRepository` | `getUserOrders`, `setUserOrders`, `invalidateUserOrders` |
| `productService` | `getProductCatalog`, `setProductCatalog`, `invalidateProducts` |
| `rateLimiter` | `checkRateLimit` |

### 3.3 Validation Seam (Candidate 8)
```
backend/src/lib/validation/
├── index.ts
├── product-validator.ts        # interface ProductValidator
├── prisma-product-validator.ts # production
└── test-product-validator.ts   # in-memory
```

**`ProductValidator` interface:**
```typescript
interface ProductValidator {
  validateItems(items: CartItemInput[], repo: PrismaRepository): Promise<ValidatedItem[]>;
}
```

**Usage:**
- `middleware/validation.ts` (`validateOrder`, `validateCartSync`) → `validator.validateItems()`
- `OrderIntakeFacade` → `validator.validateItems()` then `StockReservation.reserve()`
- **Atomic stock check remains in `StockReservation`** (defense-in-depth)

### 3.4 Tests
- Cache: unit with `TestCacheRepository`
- Validator: unit with `TestPrismaRepository`
- Integration: full invalidation flows

### 3.5 Verification
- [ ] `npm run typecheck` passes
- [ ] `npm run test --workspace=backend` passes
- [ ] No raw `cacheGet`/`cacheSet`/`CacheKeys` imports outside `lib/cache/`
- [ ] Validation logic single-sourced

---

## Phase 4: Frontend & Shared Deepening (Candidates 5, 6, 7) — Week 4

### 4.1 Cart Store Decomposition (Candidate 5)
```
frontend/src/store/cart/
├── index.ts
├── cart-items-store.ts         # Zustand: items CRUD, quantities
├── cart-persistence.ts         # Dexie/IndexedDB sync
├── cart-sync.ts                # backend sync, online/offline queue
├── cart-pricing.ts             # selectors: getTotal, getItemCount
└── cart-facade.ts              # composes above, simple API
```

**Migration:** `useCartStore` → `useCartFacade` (same API, composed internals)
- Components unchanged
- `useOnlineStatus` extracted to `hooks/useOnlineStatus.ts`

### 4.2 Frontend API Clients (Candidate 6)
```
frontend/src/api/
├── index.ts
├── http-client.ts              # interface HttpClient
├── fetch-http-client.ts        # production
├── test-http-client.ts         # MSW/in-memory
├── auth-api.ts                 # takes HttpClient
├── products-api.ts
├── cart-api.ts
├── orders-api.ts
├── addresses-api.ts
├── wishlist-api.ts
└── admin-api.ts
```

**Migration:**
- `api.ts` → deprecated barrel, re-exports for backward compat
- Components import specific: `import { ordersApi } from '@/api/orders-api'`
- `setTokenGetter` → moved to `FetchHttpClient` constructor

### 4.3 Shared Package Split (Candidate 7)
```
shared/
├── domain/                     # @twinkle-hearts/domain
│   ├── package.json
│   └── src/types/index.ts      # Product, Order, CartItem, User
├── validators/                 # @twinkle-hearts/validators
│   ├── package.json
│   └── src/index.ts            # Zod schemas (backend-only)
├── constants/                  # @twinkle-hearts/constants
│   ├── package.json
│   └── src/index.ts            # TAX_RATE, CURRENCY, WHATSAPP_NUMBER
├── api-contracts/              # @twinkle-hearts/api-contracts
│   ├── package.json
│   └── src/index.ts            # Request/Response types per endpoint
└── frontend-config/            # @twinkle-hearts/frontend-config
    ├── package.json
    └── src/index.ts            # PWA_CONFIG, theme
```

**Migration:**
- `backend/package.json`: add `@twinkle-hearts/{domain,validators,constants,api-contracts}`
- `frontend/package.json`: add `@twinkle-hearts/{domain,constants,api-contracts,frontend-config}`
- Update imports across codebase
- Remove `@twinkle-hearts/shared` from root `package.json` workspaces

### 4.4 Tests
- Frontend: unit tests for each cart module
- Frontend: API client tests with `TestHttpClient`
- Shared: type-only tests (`tsc --noEmit`)

### 4.5 Verification
- [ ] `npm run typecheck` passes (all workspaces)
- [ ] `npm run test` passes (frontend + backend)
- [ ] `npm run build` passes
- [ ] Frontend bundle size reduced (no Zod)
- [ ] Dev server starts: `npm run dev`

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| D1 `$transaction` limits | `StockReservation` uses `updateMany` with `where stock >= qty`; test against local D1 |
| Test adapter drift | Shared test factory in `backend/tests/helpers/repositories.ts` |
| Frontend build breaks | Migrate shared packages incrementally; keep barrel exports during transition |
| Cache invalidation bugs | Integration tests for each invalidation path; feature flag old cache during rollout |
| Bundle size regression | Monitor `npm run build` output; `vite-bundle-analyzer` if needed |

---

## Rollback Plan

Each phase independently revertible:
- **Phase 1:** `git revert` Prisma Repository commits; `getPrisma` restored
- **Phase 2:** `orderService` restored; facade deleted
- **Phase 3:** Cache/Validation barrel exports restored
- **Phase 4:** Frontend/Shared monoliths restored

---

## Definition of Done (Per Phase)

- [ ] TypeScript strict mode passes (`npm run typecheck`)
- [ ] All tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] God nodes reduced in Graphify (regenerate with `graphify update .`)
- [ ] New domain terms added to `CONTEXT.md`
- [ ] ADR recorded for architectural decisions

---

## Timeline Summary

| Phase | Duration | Candidates | Key Deliverable |
|-------|----------|------------|-----------------|
| 0 | 1–2 days | — | Test infra, CONTEXT.md |
| 1 | 5–7 days | 1 | `PrismaRepository` + all services migrated |
| 2 | 5–7 days | 4 | `OrderIntakeFacade` + domain modules |
| 3 | 4–5 days | 2, 8 | `CacheRepository` + `ProductValidator` |
| 4 | 5–7 days | 5, 6, 7 | Composed cart, feature APIs, split shared |
| **Total** | **~3–4 weeks** | **All 8** | **Deepened architecture** |

---

## Next Steps

1. **Confirm phase ordering** — any missed dependencies?
2. **Start Phase 1** — create `backend/src/lib/repositories/prisma-repository.ts`?
3. **Test infrastructure first** — scaffold `backend/tests/helpers/repositories.ts`?
4. **ADR template** — prepare ADR-000x for Prisma Repository seam decision?

---

*Ready to proceed with Phase 1 when you confirm.*