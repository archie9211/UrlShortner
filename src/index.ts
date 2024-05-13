// Ensure the provided URL starts with 'http://' or 'https://'
function ensureProtocol(urlString: string): string {
	if (!/^https?:\/\//.test(urlString)) {
	  return `https://${urlString}`
	}
	return urlString
  }
  
  // Generate a short URL
  function generateShortUrl(): string {
	// Simple implementation using a random string
	return Math.random().toString(36).slice(2, 8)
  }
  
  // Check if the provided URL is valid
  function isValidUrl(urlString: string): boolean {
	const urlPattern = new RegExp(
	  '^(https?:\\/\\/)?' + // Protocol (optional)
	  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // Domain name with TLD
	  '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP address
	  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // Port and path (optional)
	  '(\\?[;&a-z\\d%_.~+=-]*)?' + // Query string (optional)
	  '(\\#[-a-z\\d_]*)?$', // Fragment (optional)
	  'i'
	)
	return !!urlPattern.test(urlString)
  }
  
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
  // Handle requests to delete a URL
  async function deleteUrl(request: Request, env: Env): Promise<Response> {
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

	// Handle requests to list all URLs
	async function listUrls(request: Request, env: Env): Promise<Response> {
		const keys = await env.myUrlShortner_KV.list();
		const urls = await Promise.all(keys.keys.map(async (key: { name: string }) => {
			if (!key.name.startsWith('_') && !key.name.startsWith('http') && !key.name.startsWith('admin') ) {
				const slug = key.name;
				const shortUrl = new URL(slug, request.url).toString();
				const targetUrl = await env.myUrlShortner_KV.get(slug);
				if(targetUrl){
					return `<li><strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a><br><strong>Target URL:</strong> <a href="${targetUrl}" target="_blank">${targetUrl}</a> <button onclick="deleteUrl('${shortUrl}')">Delete</button></li>`;
				}
			}
			return '';
		}));
		const html = `
		<html lang="en">
		<head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>URL Shortener - List URLs</title>
		  <style>
			body {
				font-family: Arial, sans-serif;
				background-color: #f4f4f4;
				margin: 0;
				padding: 0;
			}
			h1 {
				text-align: center;
				color: #333;
			}
			ul {
				list-style: none;
				padding: 0;
				margin: 20px 0;
			}
			li {
				margin-bottom: 20px;
				background-color: #fff;
				padding: 20px;
				border-radius: 5px;
				box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
			}
			strong {
				display: block;
				margin-bottom: 10px;
			}
			a {
				color: #007bff;
				text-decoration: none;
			}
			button {
				background-color: #dc3545;
				color: #fff;
				border: none;
				border-radius: 3px;
				padding: 5px 10px;
				cursor: pointer;
			}
			button:hover {
				background-color: #c82333;
			}
		  </style>
		</head>
		<body>
		  <h1>URL Shortener - List URLs</h1>
		  <ul>
			${urls.join('')}
		  </ul>
		  <script>
			// Function to delete a URL
			async function deleteUrl(slug) {
				const storedUsername = localStorage.getItem('username');
    			const storedPassword = localStorage.getItem('password');
				const headers = new Headers();
				if (storedUsername && storedPassword) {
					headers.append('X-Username', storedUsername);
					headers.append('X-Password', storedPassword);
				}
				else{
					const username = prompt('Enter your username:');
					const password = prompt('Enter your password:');
					localStorage.setItem('username', username);

					localStorage.setItem('password', password);

					// Construct the headers with username and password
					headers.append('Content-Type', 'application/json');
					headers.append('X-Username', username);
					headers.append('X-Password', password);
				}
				
				const response = await fetch('/delete/' + slug, { method: 'DELETE',headers: headers});
				if (response.ok) {
					// Reload the list page after a short delay
					window.location.href = '/list';
				} else {
					localStorage.removeItem('username');

					localStorage.removeItem('password');
					alert('Failed to delete URL');
				}
			}
		  </script>
		</body>
		</html>
		`;
		return new Response(html, {
			headers: {
				'Content-Type': 'text/html'
			}
		});
	}
	
	
  


  // Handle requests to the root path
  async function handleRootRequest(request: Request, env: Env): Promise<Response> {
	const html = `
	<html lang="en">
	<head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>URL Shortener</title>
	  <style>
		body {
		  font-family: Arial, sans-serif;
		  background-color: #f4f4f4;
		  margin: 0;
		  padding: 0;
		}
	
		h1 {
		  text-align: center;
		  color: #333;
		}
	
		form {
		  max-width: 400px;
		  margin: 0 auto;
		  background-color: #fff;
		  padding: 20px;
		  border-radius: 5px;
		  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		}
	
		label {
		  display: block;
		  margin-bottom: 10px;
		  color: #666;
		}
	
		input[type="text"] {
		  width: calc(100% - 22px);
		  padding: 10px;
		  margin-bottom: 20px;
		  border: 1px solid #ccc;
		  border-radius: 3px;
		}
	
		button {
		  display: block;
		  width: 100%;
		  padding: 10px;
		  background-color: #007bff;
		  color: #fff;
		  border: none;
		  border-radius: 3px;
		  cursor: pointer;
		}
	
		button:hover {
		  background-color: #0056b3;
		}
	
		p {
		  text-align: center;
		  margin-top: 20px;
		}
	
		#shortened-url, #error-message {
		  font-weight: bold;
		}
	
		#error-message {
		  color: red;
		}
	  </style>
	</head>
	<body>
	  <h1>URL Shortener</h1>
	  <form id="form">
		<label for="url">Enter URL:</label>
		<input type="text" id="url" name="url" required>
		<button type="submit">Shorten</button>
	  </form>
	  <p id="shortened-url"></p>
	  <p id="error-message"></p>
	  <script>
		const form = document.getElementById('form');
		const shortenedUrlElement = document.getElementById('shortened-url');
		const errorMessageElement = document.getElementById('error-message');
	
		form.addEventListener('submit', async (event) => {
		  event.preventDefault();
		  const url = document.getElementById('url').value;
		  const response = await fetch('/', {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({ url })
		  });
	
		  if (response.ok) {
			const shortUrl = await response.text();
			shortenedUrlElement.textContent = 'Shortened URL: ' + shortUrl;
			errorMessageElement.textContent = '';
		  } else {
			const errorMessage = await response.text();
			shortenedUrlElement.textContent = '';
			errorMessageElement.textContent = errorMessage;
		  }
		});
	  </script>
	</body>
	</html>
	
	`

	
  
	// Handle POST requests to create a short URL
	if (request.method === 'POST') {
	  const { url } = await request.json<{ url: string }>()
  
	  // Validate the URL
	  if (!isValidUrl(url)) {
		return new Response('Invalid URL', { status: 400 })
	  }
  
	  const normalizedUrl = ensureProtocol(url)
	  // Check if a short URL already exists for the given URL
	  const existingSlug = await env.myUrlShortner_KV.get(normalizedUrl)
	  if (existingSlug) {
		const shortUrl = new URL(existingSlug, request.url).toString()
		return new Response(shortUrl)
	  }
  
	  // Create a new short URL if it doesn't exist
	  const slug = generateShortUrl()
	  await env.myUrlShortner_KV.put(slug, normalizedUrl)

	  await env.myUrlShortner_KV.put(normalizedUrl,slug)
	  const shortUrl = new URL(slug, request.url).toString()
	  return new Response(shortUrl)
	}
  
	// Return the HTML form for GET requests
	return new Response(html, {
	  headers: {
		'Content-Type': 'text/html'
	  }
	})
  }
  
  // Define the KV namespace binding
  interface Env {
	myUrlShortner_KV: KVNamespace
  }