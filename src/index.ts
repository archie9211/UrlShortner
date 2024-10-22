import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { rootHtml, listHtml } from './html'

// Types
type Bindings = {
  myUrlShortner_KV: KVNamespace
}

type Variables = {
  authenticated: boolean
}

// Utility functions
function generateShortUrl(): string {
  return Math.random().toString(36).slice(2, 8)
}

function isValidUrl(urlString: string): boolean {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

// Create Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware for CORS
app.use('*', cors())

// Authentication middleware
async function authMiddleware(c: any, next: any) {
  const username = c.req.header('X-Username')
  const password = c.req.header('X-Password')

  if (!username || !password) {
    return c.text('Unauthorized: Username or password missing', 401)
  }

  const storedPassword = await c.env.myUrlShortner_KV.get(username)
  if (!storedPassword || password !== storedPassword) {
    return c.text('Unauthorized: Invalid username or password', 401)
  }

  c.set('authenticated', true)
  await next()
}

// Routes
// Root route - Handle both GET and POST
app.get('/', (c) => {
  return c.html(rootHtml)
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const url = body.url

  if (!isValidUrl(url)) {
    return c.text('Invalid URL', 400)
  }

  const existingSlug = await c.env.myUrlShortner_KV.get(url)
  if (existingSlug) {
    const shortUrl = new URL(existingSlug, c.req.url).toString()
    return c.text(shortUrl)
  }

  const slug = generateShortUrl()
  await c.env.myUrlShortner_KV.put(slug, url)
  await c.env.myUrlShortner_KV.put(url, slug)
  
  const shortUrl = new URL(slug, c.req.url).toString()
  return c.text(shortUrl)
})

// List URLs route
app.get('/list', async (c) => {
  const truncateUrl = (url: string, maxLength = 35) => {
    if (url.length <= maxLength) return url
    return url.slice(0, maxLength) + '...'
  }

  const keys = await c.env.myUrlShortner_KV.list()
  const urls = await Promise.all(
    keys.keys.map(async (key) => {
      if (!key.name.startsWith('_') && !key.name.startsWith('http') && !key.name.startsWith('admin')) {
        const slug = key.name
        const shortUrl = new URL(slug, c.req.url).toString()
        const targetUrl = await c.env.myUrlShortner_KV.get(slug)
        
        if (targetUrl) {
          const truncatedTargetUrl = truncateUrl(targetUrl)
          return `<li class="list-group-item">
            <strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a><br>
            <strong>Target URL:</strong> <a href="${targetUrl}" target="_blank">${truncatedTargetUrl}</a>
            <button class="btn btn-danger btn-sm float-right" onclick="deleteUrl('${slug}')">Delete</button>
          </li>`
        }
      }
      return ''
    })
  )

  return c.html(listHtml(urls.join('')))
})

// Delete URL route with authentication
app.delete('/delete/:slug', authMiddleware, async (c) => {
  const slug = c.req.param('slug')
  
  if (!slug) {
    return c.text('Invalid slug', 400)
  }

  const url = await c.env.myUrlShortner_KV.get(slug)
  if (url) {
    await c.env.myUrlShortner_KV.delete(slug)
    await c.env.myUrlShortner_KV.delete(url)
    return c.text('URL deleted successfully')
  }

  return c.text('URL not found', 404)
})

// Redirect route for shortened URLs
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const redirectUrl = await c.env.myUrlShortner_KV.get(slug)

  if (redirectUrl) {
    const url = new URL(redirectUrl)
    return c.redirect(url.toString(), 302)
  }

  return c.text('Not Found', 404)
})

export default app