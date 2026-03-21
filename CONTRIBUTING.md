# Contributing to Twinkle-Hearts

## ⚠️ Confidentiality Notice

**This is a PRIVATE COMMERCIAL PROJECT.**

By contributing to this project, you agree to:
- Keep all code and documentation confidential
- Not share, distribute, or disclose any project details
- Use the code only for authorized project work
- Comply with any Non-Disclosure Agreement (NDA) if applicable

## Development Setup

### Prerequisites
- Node.js 20+ (use `nvm use` to switch versions)
- npm 10+ or pnpm 8+
- PostgreSQL 15+ (for backend development)
- Git

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd twinkle-hearts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Changes
- Follow the code conventions in `.qwen/rules.md`
- Write tests for new features
- Update documentation if needed

### 3. Run Checks Before Committing
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm run test

# Build verification
npm run build
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat(scope): description of changes"
```

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/).

### 5. Push and Create PR
```bash
git push origin feat/your-feature-name
```

## Code Style Guidelines

### General
- Use TypeScript for all new code
- Follow ESLint rules (auto-fixed on commit via lint-staged)
- Use Prettier for formatting (auto-applied on commit)
- Keep functions small and focused
- Use meaningful variable and function names

### Frontend (React)
```typescript
// ✅ Good: Functional component with hooks
const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCartStore();
  
  const handleAddToCart = () => {
    addItem(product.id, 1);
  };

  return <div>{product.name}</div>;
};

// ❌ Avoid: Class components, unnecessary state
```

### Backend (Node.js)
```typescript
// ✅ Good: Async/await, error handling
export const getProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  return product;
};

// ❌ Avoid: Callbacks, raw SQL without ORM
```

### Database
- Use Prisma for all database operations
- Always validate input before database operations
- Use transactions for multi-step operations

## Testing

### Test Frameworks
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest
- **E2E**: Playwright

### Frontend Tests
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', async () => {
    const mockOnAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);
    
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
```

### Backend Tests
```typescript
import { getProduct } from '../services/productService';
import { prisma } from '../lib/prisma';

describe('getProduct', () => {
  it('returns a product', async () => {
    const product = await getProduct('valid-id');
    expect(product).toBeDefined();
  });

  it('throws NotFoundError for invalid id', async () => {
    await expect(getProduct('invalid-id')).rejects.toThrow(NotFoundError);
  });
});
```

### E2E Tests (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('completes purchase via WhatsApp', async ({ page }) => {
    await page.goto('/');
    
    // Browse products
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    
    // Add to cart
    await page.getByRole('button', { name: 'Add to Cart' }).first().click();
    
    // Navigate to cart
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible();
    
    // Checkout
    await page.getByRole('button', { name: 'Checkout with WhatsApp' }).click();
  });
});
```

### Running Tests
```bash
# Frontend tests
npm run test --workspace=frontend
npm run test:watch --workspace=frontend
npm run test:coverage --workspace=frontend

# Backend tests
npm run test --workspace=backend
npm run test:watch --workspace=backend
npm run test:coverage --workspace=backend

# E2E tests
npx playwright test
npx playwright test --ui
```

## Pull Request Guidelines

### PR Title
Follow Conventional Commits format:
- `feat(cart): add offline sync support`
- `fix(api): resolve price validation bug`
- `test(products): add unit tests for product service`
- `docs(api): add Swagger documentation`

### PR Description Template
```markdown
## What does this PR do?
Brief description of changes.

## Why is this change needed?
Context and motivation.

## How was it tested?
Testing approach and results.

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] API docs updated (if backend route changed)
- [ ] Type checking passes
- [ ] Linting passes
- [ ] No console errors or warnings
```

### API Documentation
For backend route changes, add JSDoc annotations:
```typescript
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *     responses:
 *       200:
 *         description: List of products
 */
```

## Release Process

1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Deploy to staging
5. Test in staging
6. Deploy to production

## Questions?

Check the following resources:
- `README.md` - Project overview
- `.qwen/rules.md` - Project-specific rules
- `PROGRESS.md` - Current development status

---

**© 2026 Twinkle-Hearts. All Rights Reserved.**
**Private Commercial Project - Confidential**
