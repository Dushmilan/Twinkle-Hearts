# Private Commercial Project - Twinkle-Hearts

## Project Overview

Twinkle-Hearts is a **proprietary** Progressive Web Application (PWA) for e-commerce that replaces traditional payment gateways with a WhatsApp-based checkout flow. This is a **private commercial product** developed for business purposes.

## ⚠️ Confidentiality Notice

**This project is NOT open source.**

All code, documentation, designs, business logic, and intellectual property in this repository are:
- **Confidential** - Internal use only
- **Proprietary** - Owned by the project owners
- **Protected** - All rights reserved

### Restrictions

- ❌ No redistribution without written permission
- ❌ No public disclosure of code or architecture
- ❌ No use for personal projects or portfolios
- ❌ No sharing with third parties
- ❌ No posting on public repositories or forums

## Business Model

Instead of integrating payment processors, customers finalize their orders by sending a pre-formatted order summary via WhatsApp to the business. This approach:
- Reduces integration complexity and costs
- Enables direct customer-business communication
- Works well in markets where WhatsApp is the primary communication channel
- Allows for order customization and negotiation before confirmation

## Core Features

### Product Catalog
- Browse products with images, descriptions, and pricing
- Product search functionality
- Category-based filtering
- Real-time stock availability display

### Persistent Cart
- Cart persists across browser sessions
- Offline cart support via IndexedDB
- Automatic sync with backend when online
- Stock validation before checkout

### WhatsApp Checkout
- Pre-formatted order messages with order ID, items, and totals
- Deep link to WhatsApp for seamless handoff
- Direct customer-business communication

### Order Management
- Unique order ID generation
- Price validation server-side (never trust frontend)
- Audit logging for price tampering attempts

## Technical Architecture

### Frontend
- React-based Single Page Application
- Progressive Web App capabilities (offline support, installable)
- State management with Zustand
- Local persistence using IndexedDB and LocalStorage
- Service Worker for offline functionality and background sync

### Backend
- Node.js with Express framework
- RESTful API design
- PostgreSQL database for data persistence
- Server-side price and stock validation
- Order state machine for tracking order lifecycle

### WhatsApp Integration
- Client-side: Deep links (wa.me) with pre-encoded messages
- Server-side: WhatsApp Business API for template messages (future)

### Security
- All price calculations performed server-side
- Frontend prices are reference-only
- Rate limiting on order creation endpoints
- Audit logging for price tampering attempts

## Infrastructure

- **Frontend Hosting**: Vercel or Netlify (CDN-enabled static hosting)
- **Backend Hosting**: Railway, Render, or AWS EC2
- **Database**: PostgreSQL (managed service recommended)
- **Cache**: Redis for sessions and rate limiting (optional)
- **CDN**: Cloudflare for asset delivery and DDoS protection

## Target Users

- Small to medium businesses in WhatsApp-first markets
- Customers who prefer conversational commerce
- Businesses wanting to avoid payment gateway fees and complexity

## Development Phases

### Phase 1: MVP
- Product catalog with basic CRUD
- Cart with local persistence
- WhatsApp deep link checkout
- Basic order tracking

### Phase 2: Enhanced Features
- User authentication
- Order history
- WhatsApp Business API integration
- Admin dashboard

### Phase 3: Scale
- Multi-vendor support
- Analytics dashboard
- Inventory management
- Marketing integrations

## Key Design Decisions

1. **No Payment Gateway**: Orders are confirmed via WhatsApp conversation, not automated payment
2. **Offline-First Cart**: Cart works without internet, syncs when connection restored
3. **Server-Side Price Authority**: Frontend never determines final prices
4. **Progressive Enhancement**: Start with deep links, upgrade to Business API later

## Current Status

Project scaffolding complete. All core features implemented and ready for testing.

### Known Gaps (To Address)
| Priority | Gap | Impact |
|----------|-----|--------|
| 🔴 High | No testing infrastructure | Cannot verify code quality |
| 🔴 High | No CI/CD pipeline | Manual testing and deployment |
| 🔴 High | No API documentation | Hard to discover endpoints |
| 🟡 Medium | No error boundaries | Poor error UX |
| 🟡 Medium | No toast notifications | No user feedback |
| 🟡 Medium | No loading states | Unclear loading states |

See `PROGRESS.md` Phase 0 for detailed action items.

## Session Workflow

At the start of each development session:
1. Read this README to understand project context
2. Review PROGRESS.md for current implementation status
3. Check rules.md for project-specific guidelines

At the end of each session or after major changes:
1. Update PROGRESS.md with completed work
2. Update this README if any architectural changes were made
3. Note any blockers or decisions for the next session

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**

**Project Created**: March 21, 2026
**Last Updated**: March 21, 2026
**Version**: 0.0.2 (Scaffolding Complete, Testing Pending)
**Classification**: Private Commercial - Confidential

## Quick Reference

- **Documentation**: `README.md` (this file), `PROGRESS.md`, `CONTRIBUTING.md`
- **Project Rules**: `.qwen/rules.md`
- **Environment Setup**: `.env.example` → `.env.local`
- **Start Development**: `npm run dev`
- **Run Tests**: `npm test` (after test setup)
- **Database**: `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`
- **Docker**: `docker-compose up -d`
