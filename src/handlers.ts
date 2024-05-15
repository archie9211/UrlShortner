import { generateShortUrl, isValidUrl } from './utils';
import { rootHtml, listHtml } from './html';

export async function handleRootRequest(request: Request, env: Env): Promise<Response> {
	if (request.method === 'POST') {
		const requestJson: Request = await request.json();
		const url = requestJson.url;
		if (!isValidUrl(url)) {
			return new Response('Invalid URL', { status: 400 });
		}
		// const normalizedUrl = ensureProtocol(url);
		const existingSlug = await env.myUrlShortner_KV.get(url);
		if (existingSlug) {
			const shortUrl2 = new URL(existingSlug, request.url).toString();
			return new Response(shortUrl2);
		}
		const slug = generateShortUrl();
		await env.myUrlShortner_KV.put(slug, url);
		await env.myUrlShortner_KV.put(url, slug);
		const shortUrl = new URL(slug, request.url).toString();
		return new Response(shortUrl);
	}
	return new Response(rootHtml, {
		headers: { 'Content-Type': 'text/html' },
	});
}

export async function listUrls(request: Request, env: Env): Promise<Response> {
	const truncateUrl = (url: string, maxLength = 35) => {
		if (url.length <= maxLength) return url;
		return url.slice(0, maxLength) + '...';
	};

	const keys = await env.myUrlShortner_KV.list();
	const urls = await Promise.all(
		keys.keys.map(async (key) => {
			if (!key.name.startsWith('_') && !key.name.startsWith('http') && !key.name.startsWith('admin')) {
				const slug = key.name;
				const shortUrl = new URL(slug, request.url).toString();
				const targetUrl = await env.myUrlShortner_KV.get(slug);
				if (targetUrl) {
					const truncatedTargetUrl = truncateUrl(targetUrl);
					return `<li class="list-group-item">
                  <strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a><br>
                  <strong>Target URL:</strong> <a href="${targetUrl}" target="_blank">${truncatedTargetUrl}</a>
                  <button class="btn btn-danger btn-sm float-right" onclick="deleteUrl('${slug}')">Delete</button>
                </li>`;
				}
			}
			return '';
		}),
	);
	return new Response(listHtml(urls.join('')), {
		headers: { 'Content-Type': 'text/html' },
	});
}

export async function deleteUrl(request: Request<unknown, CfProperties<unknown>>, env: Env): Promise<Response> {
	const username = request.headers.get('X-Username');
	const password = request.headers.get('X-Password');
	if (!username || !password) {
		return new Response('Unauthorized: Username or password missing', { status: 401 });
	}
	const storedPassword = await env.myUrlShortner_KV.get(username);
	if (storedPassword && password === storedPassword) {
		const { pathname } = new URL(request.url);
		const slug = pathname.split('/').pop();
		if (slug) {
			const url = await env.myUrlShortner_KV.get(slug);

			if (url) {
				await env.myUrlShortner_KV.delete(slug);
			}
		} else {
			return new Response('Invalid slug', { status: 400 });
		}
		return new Response('URL deleted successfully', { status: 200 });
	} else {
		return new Response('Unauthorized: Invalid username or password', { status: 401 });
	}
}
