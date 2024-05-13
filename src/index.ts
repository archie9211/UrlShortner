import { handleRootRequest, listUrls, deleteUrl } from './handlers';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Check if the request is for the root path
    if (pathname === '/') {
      return handleRootRequest(request, env);
    } else if (pathname === '/list') {
      return listUrls(request, env);
    } else if (pathname.startsWith('/delete/')) {
      return deleteUrl(request, env);
    }

    // Check if the request is for a shortened URL
    const slug = pathname.slice(1);
    const redirectUrl = await env.myUrlShortner_KV.get(slug);
    if (redirectUrl) {
      // Ensure the URL starts with 'https://' when redirecting
      const url = new URL(ensureProtocol(redirectUrl));
      return Response.redirect(url.toString(), 302);
    }

    // Return 404 for invalid URLs
    return new Response('Not Found', { status: 404 });
  }
}

import { ensureProtocol } from './utils';

// Define the KV namespace binding
interface Env {
  myUrlShortner_KV: KVNamespace
}