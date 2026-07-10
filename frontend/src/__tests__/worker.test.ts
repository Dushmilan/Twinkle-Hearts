import { describe, it, expect, vi } from 'vitest';

const mockAPIFetch = vi.fn();
const mockAssetsFetch = vi.fn();
const env = { API: { fetch: mockAPIFetch }, ASSETS: { fetch: mockAssetsFetch } };

function createEdgeHandler() {
  return {
    async fetch(request: Request, env: { API: { fetch: typeof fetch }; ASSETS: { fetch: typeof fetch } }, _ctx: unknown) {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/images/')) {
        return env.API.fetch(request);
      }
      return env.ASSETS.fetch(request);
    },
  };
}

describe('_worker.js edge routing specification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should proxy /api/* requests to the backend Worker', async () => {
    const handler = createEdgeHandler();
    const request = new Request('https://twinkle-hearts.pages.dev/api/products');
    mockAPIFetch.mockResolvedValue(new Response('ok'));

    await handler.fetch(request, env as any, {} as any);

    expect(mockAPIFetch).toHaveBeenCalledWith(request);
    expect(mockAssetsFetch).not.toHaveBeenCalled();
  });

  it('should proxy /images/* requests to the backend Worker', async () => {
    const handler = createEdgeHandler();
    const request = new Request('https://twinkle-hearts.pages.dev/images/products/abc.jpg');
    mockAPIFetch.mockResolvedValue(new Response('image'));

    await handler.fetch(request, env as any, {} as any);

    expect(mockAPIFetch).toHaveBeenCalledWith(request);
    expect(mockAssetsFetch).not.toHaveBeenCalled();
  });

  it('should proxy /images/* sub-paths to the backend Worker', async () => {
    const handler = createEdgeHandler();
    const request = new Request('https://twinkle-hearts.pages.dev/images/products/abc-123.jpg');
    mockAPIFetch.mockResolvedValue(new Response('image'));

    await handler.fetch(request, env as any, {} as any);

    expect(mockAPIFetch).toHaveBeenCalledWith(request);
    expect(mockAssetsFetch).not.toHaveBeenCalled();
  });

  it('should serve static assets for all other paths', async () => {
    const handler = createEdgeHandler();
    const request = new Request('https://twinkle-hearts.pages.dev/');
    mockAssetsFetch.mockResolvedValue(new Response('html'));

    await handler.fetch(request, env as any, {} as any);

    expect(mockAssetsFetch).toHaveBeenCalledWith(request);
    expect(mockAPIFetch).not.toHaveBeenCalled();
  });

  it('should serve static assets for PWA icons', async () => {
    const handler = createEdgeHandler();
    const request = new Request('https://twinkle-hearts.pages.dev/pwa-192x192.png');
    mockAssetsFetch.mockResolvedValue(new Response('png'));

    await handler.fetch(request, env as any, {} as any);

    expect(mockAssetsFetch).toHaveBeenCalledWith(request);
    expect(mockAPIFetch).not.toHaveBeenCalled();
  });
});
