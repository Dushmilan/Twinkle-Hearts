export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/images/')) {
      return env.API.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};