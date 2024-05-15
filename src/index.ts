import { handleRootRequest, listUrls, deleteUrl } from './handlers';
import { ensureProtocol } from './utils';

export default {
  async fetch(request:Request, env:Env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/") {
      return handleRootRequest(request, env);
    } else if (pathname === "/list") {
      return listUrls(request, env);
    } else if (pathname.startsWith("/delete/")) {
      return deleteUrl(request, env);
    }
    const slug = pathname.slice(1);
    const redirectUrl = await env.myUrlShortner_KV.get(slug);
    if (redirectUrl) {
      const url = new URL(ensureProtocol(redirectUrl));
      return Response.redirect(url.toString(), 302);
    }
    return new Response("Not Found", { status: 404 });
  }
};

