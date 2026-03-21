# Twinkle-Hearts Project Rules

## ⚠️ Project Classification: PRIVATE COMMERCIAL

This is a **private commercial project**. All code, documentation, and intellectual property are confidential and proprietary.

### Confidentiality Requirements
- Do not share code publicly
- Do not post on GitHub as public repository
- Do not use in portfolios without permission
- Do not disclose business logic to third parties

## Session Workflow

### At Session Start (MANDATORY)
1. **Read README.md** - Understand project context, architecture, and current status
2. **Read PROGRESS.md** - Review what has been implemented and what's pending
3. **Check for blockers** - Identify any issues from the previous session

### During Development
1. **Follow architecture** - Adhere to the technical design in README.md
2. **Code conventions** - Match existing code style (naming, structure, patterns)
3. **Security first** - Never trust frontend prices, always validate server-side
4. **Type safety** - Use TypeScript with strict mode where applicable
5. **Test coverage** - Add tests for critical paths (order creation, price validation)

### At Session End or After Major Changes (MANDATORY)
1. **Update PROGRESS.md** - Mark completed items, add new pending items
2. **Update README.md** - If architecture or status changed
3. **Document decisions** - Note any deviations from original design
4. **List blockers** - Any issues the next session should address

## Code Quality Rules

### Frontend (React)
- Use functional components with hooks
- Prefer Zustand for state management
- All cart operations must be optimistic + sync pattern
- Service Worker must handle offline queue
- PWA manifest must be configured

### Backend (Node.js/Express)
- All routes must be in `/api/*` namespace
- Middleware chain: rateLimit → auth → validation → handler
- Never expose raw database errors to client
- Use Prisma for database operations
- All prices must be validated against database

### Database
- Use Prisma ORM with PostgreSQL
- All monetary values: `Decimal(10, 2)`
- Order IDs: UUID
- Soft deletes where applicable (isActive flag)

### Security
- Rate limit order creation endpoints
- Validate all input with Zod or Joi
- CORS configured for production domain only
- Environment variables for all secrets
- Audit log for price tampering attempts

### WhatsApp Integration
- Deep link format: `wa.me/{number}?text={encoded_message}`
- Message template must include: Order ID, customer name, items, total
- Order expires after 15 minutes if not confirmed
- Webhook endpoint for Business API callbacks

## File Structure Conventions

```
/frontend
  /src
    /components     - Reusable UI components
    /pages          - Route-level components
    /store          - Zustand stores
    /services       - API client functions
    /hooks          - Custom React hooks
    /utils          - Pure utility functions
    /types          - TypeScript type definitions

/backend
  /src
    /routes         - Express route handlers
    /middleware     - Express middleware
    /services       - Business logic
    /lib            - Database, config, utilities
    /types          - TypeScript type definitions
```

## Commit Message Format

```
<type>(<scope>): <subject>

<body - optional>

<footer - optional>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example: `feat(cart): add offline sync with IndexedDB`

## Decision Log

Any significant architectural or implementation decisions must be documented in PROGRESS.md under a "Decisions" section with:
- What was decided
- Why it was decided
- Alternatives considered
- Date of decision

## Reminders

- ✅ Read README.md at session start
- ✅ Read PROGRESS.md at session start
- ✅ Update PROGRESS.md at session end
- ✅ Update README.md if architecture changes
- ✅ Never commit .env files
- ✅ Never trust frontend prices
- ✅ Always validate against database

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**
**Private Commercial Project - Confidential**

**Rules Created**: March 21, 2026
**Last Updated**: March 21, 2026
