import supabase from '../../../lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'https://questionwale.com'
const MAX_URLS_PER_SITEMAP = 5000
const SITEMAP_SECRET = process.env.SITEMAP_SECRET

function isAuthorized(req: Request) {
  return true
}

function slugify(s: any) {
  if (!s) return ''
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function decodeCursor(token?: string) {
  if (!token) return null
  try {
    const buf = Buffer.from(token, 'base64url')
    return buf.toString('utf8')
  } catch (e) {
    return null
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 })

  try {
    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor') || undefined
    const lastId = cursor ? decodeCursor(cursor) : null

    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    const footer = '\n</urlset>'

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(header))

        const now = new Date().toISOString()
        if (!lastId) {
          const staticPages = ['/', '/subjects', '/practice', '/contact', '/history', '/questions']
          for (const p of staticPages) {
            const urlp = `${SITE_URL}${p}`
            const entry = `  <url>\n    <loc>${urlp}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${urlp === `${SITE_URL}/` ? '1.0' : '0.7'}</priority>\n  </url>\n`
            controller.enqueue(new TextEncoder().encode(entry))
          }
        }

        let query: any = supabase.from('history_questions').select('*').order('id', { ascending: true }).limit(MAX_URLS_PER_SITEMAP)
        if (lastId) query = query.gt('id', lastId)
        const { data, error } = await query
        if (error) throw error

        for (const doc of data || []) {
          const slug = doc.topic || doc.id
          const urlp = `${SITE_URL}/quiz/${slugify(slug)}`
          const lastmod = doc.created_at ? new Date(doc.created_at).toISOString() : now
          const entry = `  <url>\n    <loc>${urlp}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`
          controller.enqueue(new TextEncoder().encode(entry))
        }

        controller.enqueue(new TextEncoder().encode(footer))
        controller.close()
      },
      cancel() {
        // nothing to cancel
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err: any) {
    console.error('Sitemap keyset generation error', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
