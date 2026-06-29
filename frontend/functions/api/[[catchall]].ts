export async function onRequest(context: EventContext<{ API_WORKER_URL: string }>) {
  const { request, env } = context;
  const url = new URL(request.url);
  const baseUrl = env.API_WORKER_URL;
  if (!baseUrl) {
    return new Response('API_WORKER_URL environment variable not set', { status: 500 });
  }
  const target = new URL(url.pathname + url.search, baseUrl);
  return fetch(target.toString(), request);
}
