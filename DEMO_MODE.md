# Demo Mode Setup - No Database Required

## Quick Start (No Database)

The project is now configured to run with **in-memory mock data** for development demos. No database setup needed!

### Just Run:
```bash
npm run dev
```

That's it! The app will start with sample product data loaded automatically.

### Access Points:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## What's Included

### Sample Products (8 items)
- Classic Heart Necklace - ₹2,999
- Rose Gold Bracelet - ₹1,499
- Crystal Drop Earrings - ₹899
- Infinity Ring Set - ₹1,299
- Pearl Pendant Necklace - ₹3,499
- Charm Bracelet - ₹2,199
- Stud Earring Set - ₹699
- Birthstone Ring - ₹1,799

### Features Working
✅ Product catalog browsing
✅ Product search
✅ Product detail pages
✅ Add to cart
✅ Cart persistence (localStorage + IndexedDB)
✅ Offline support
✅ WhatsApp checkout flow
✅ Order creation and tracking
✅ Order expiration (cron job)

## Data Persistence

**Important:** Since this uses in-memory data:
- Products reset on server restart (but are re-seeded automatically)
- Orders are lost when server stops
- Cart persists in browser (localStorage/IndexedDB)

## Switching to Real Database (Production)

When ready to use PostgreSQL:

1. **Update `backend/src/lib/prisma.ts`:**
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

2. **Update `backend/.env.local`:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/twinkle_hearts_dev
```

3. **Run migrations:**
```bash
cd backend
npm run db:migrate
npm run db:seed
```

## Demo Flow

1. Open http://localhost:5173
2. Browse products
3. Click a product to see details
4. Add items to cart
5. Go to cart and adjust quantities
6. Click "Proceed to Checkout"
7. Enter name and WhatsApp number
8. Click "Confirm & Send via WhatsApp"
9. Order created! Check http://localhost:3001/api/orders to see orders

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**
**Private Commercial Project - Confidential**
