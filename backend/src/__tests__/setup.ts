vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('@prisma/adapter-d1', () => ({
  PrismaD1: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));
