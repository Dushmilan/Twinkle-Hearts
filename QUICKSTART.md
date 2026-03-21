# Quick Start Guide - Twinkle-Hearts

## Prerequisites

- **Node.js 20+** (use `nvm use` to switch versions)
- **Docker Desktop** (for PostgreSQL and Redis)
- **Git**

## Initial Setup (One-Time)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy environment template
copy .env.example .env.local

# Edit .env.local with your configuration
# At minimum, set DATABASE_URL
```

### 3. Start Database Services

```bash
# Start PostgreSQL, Redis, and pgAdmin
docker-compose up -d

# Wait for database to be ready (about 30 seconds)
docker-compose ps
```

### 4. Run Database Migrations

```bash
# Generate Prisma client and run migrations
npm run db:migrate
```

### 5. Seed Sample Products

```bash
# Add sample jewelry products to database
npm run db:seed
```

## Development

### Start All Services

```bash
# Starts both frontend (port 5173) and backend (port 3001)
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **pgAdmin** (Database GUI): http://localhost:5050
  - Email: `admin@twinklehearts.local`
  - Password: `admin`

### Test the Flow

1. Browse products on the home page
2. Click a product to view details
3. Add items to cart
4. Go to cart and adjust quantities
5. Proceed to checkout
6. Enter your name and WhatsApp number
7. Click "Confirm & Send via WhatsApp"
8. Order will be created and WhatsApp will open with pre-filled message

## Useful Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Database commands
npm run db:studio      # Open Prisma Studio (database GUI)
npm run db:migrate     # Run migrations
npm run db:seed        # Seed sample data

# Stop Docker services
docker-compose down

# View Docker logs
docker-compose logs -f
```

## Project Structure

```
twinkle-hearts/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   └── lib/         # Database, logger
│   └── prisma/          # Database schema & seeds
├── frontend/            # React PWA
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── store/       # Zustand stores
│       └── hooks/       # Custom hooks
├── shared/              # Shared types & utilities
└── docker-compose.yml   # Local development services
```

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Port Already in Use

```bash
# Frontend port 5173 in use
# Change in frontend/vite.config.ts

# Backend port 3001 in use
# Change PORT in .env.local
```

### Prisma Client Errors

```bash
# Regenerate Prisma client
npm run db:generate
```

## Next Steps

1. Customize product catalog in `backend/prisma/seed.ts`
2. Update WhatsApp number in `.env.local`
3. Add product images to `frontend/public/images/`
4. Customize branding in `frontend/src/index.css`
5. Configure PWA icons in `frontend/public/`

---

**Need Help?** Check `README.md` for project overview or `CONTRIBUTING.md` for development guidelines.

**© 2026 Twinkle-Hearts. All Rights Reserved.**
