import { rootHtml, listHtml } from './html';
import { ensureProtocol, generateShortUrl, isValidUrl } from './utils';

// Handle requests to the root path
export async function handleRootRequest(request: Request, env: Env): Promise<Response> {
  // Handle POST requests to create a short URL
  if (request.method === 'POST') {
    const { url } = await request.json<{ url: string }>();

    // Validate the URL
    if (!isValidUrl(url)) {
      return new Response('Invalid URL', { status: 400 });
    }

    const normalizedUrl = ensureProtocol(url);
    // Check if a short URL already exists for the given URL
    const existingSlug = await env.myUrlShortner_KV.get(normalizedUrl);
    if (existingSlug) {
      const shortUrl = new URL(existingSlug, request.url).toString();
      return new Response(shortUrl);
    }

    // Create a new short URL if it doesn't exist
    const slug = generateShortUrl();
    await env.myUrlShortner_KV.put(slug, normalizedUrl);
    await env.myUrlShortner_KV.put(normalizedUrl, slug);
    const shortUrl = new URL(slug, request.url).toString();
    return new Response(shortUrl);
  }

  // Return the HTML form for GET requests
  return new Response(rootHtml, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

// Handle requests to list all URLs
export async function listUrls(request: Request, env: Env): Promise<Response> {
  const keys = await env.myUrlShortner_KV.list();
  const urls = await Promise.all(keys.keys.map(async (key: { name: string }) => {
    if (!key.name.startsWith('_') && !key.name.startsWith('http') && !key.name.startsWith('admin')) {
      const slug = key.name;
      const shortUrl = new URL(slug, request.url).toString();
      const targetUrl = await env.myUrlShortner_KV.get(slug);
      if (targetUrl) {
        return `<li><strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a><br><strong>Target URL:</strong> <a href="${targetUrl}" target="_blank">${targetUrl}</a> <button onclick="deleteUrl('${shortUrl}')">Delete</button></li>`;
      }
    }
    return '';
  }));

  return new Response(listHtml(urls.join('')), {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

// Handle requests to delete a URL
export async function deleteUrl(request: Request, env: Env): Promise<Response> {
  // Extract username and password from the request
  const username = request.headers.get('X-Username');
  const password = request.headers.get('X-Password');

  // Check if username and password are provided
  if (!username || !password) {
    // If username or password is missing, return unauthorized response
    return new Response('Unauthorized: Username or password missing', { status: 401 });
  }

  // Fetch the stored password associated with the provided username
  const storedPassword = await env.myUrlShortner_KV.get(username);

  // Check if stored password exists and matches the provided password
  if (storedPassword && password === storedPassword) {
    // If password matches, proceed with deleting the URL
    const { pathname } = new URL(request.url);
    const slug = pathname.split('/').pop(); // Extract the slug from the URL
    const url = await env.myUrlShortner_KV.get(slug);
    await env.myUrlShortner_KV.delete(slug);

    // For simplicity, also delete the reverse mapping
    if (url) {
      await env.myUrlShortner_KV.delete(url);
    }

    return new Response('URL deleted successfully', { status: 200 });
  } else {
    // If password does not match, return unauthorized response
    return new Response('Unauthorized: Invalid username or password', { status: 401 });
  }
}