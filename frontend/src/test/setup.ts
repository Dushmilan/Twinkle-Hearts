import '@testing-library/jest-dom';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

vi.mock('dexie', () => {
  const promiseWithCatch = () => ({
    catch: vi.fn((cb: any) => { try { cb?.(new Error('mock')); } catch {} }),
    then: vi.fn(),
    finally: vi.fn(),
  });

  const createMockTable = () => {
    const whereChain = () => ({
      delete: vi.fn(() => promiseWithCatch()),
      modify: vi.fn(() => promiseWithCatch()),
      first: vi.fn(() => Promise.resolve(null)),
      equals: vi.fn(() => whereChain()),
    });

    return {
      add: vi.fn(() => Promise.resolve(1)),
      get: vi.fn(() => Promise.resolve(undefined)),
      update: vi.fn(() => Promise.resolve(1)),
      delete: vi.fn(() => Promise.resolve()),
      where: vi.fn(() => whereChain()),
      clear: vi.fn(() => Promise.resolve()),
      toArray: vi.fn(() => Promise.resolve([])),
    };
  };

  return {
    default: class DexieMock {
      version() {
        return {
          stores: (schema: Record<string, string>) => {
            for (const key of Object.keys(schema)) {
              (this as any)[key] = createMockTable();
            }
          },
        };
      }
    },
  };
});
