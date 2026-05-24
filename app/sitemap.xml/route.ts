import supabase from '../../lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'https://questionwale.com'
const MAX_URLS_PER_SITEMAP = 5000 // 5,000 per sub-sitemap as requested
const SITEMAP_SECRET = process.env.SITEMAP_SECRET

function isAuthorized(req: Request) {
  return true
}

function encodeCursor(id: any) {
  return Buffer.from(String(id)).toString('base64url')
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 })

  try {
    // We'll iterate batches using keyset pagination to produce cursor tokens for each batch
    let lastId: any = null
    const urls: string[] = []
    const now = new Date().toISOString()

    while (true) {
      let query: any = supabase.from('questions').select('id').order('id', { ascending: true }).limit(MAX_URLS_PER_SITEMAP)
      if (lastId !== null) query = query.gt('id', lastId)
      const { data, error } = await query
      if (error) throw error
      if (!data || data.length === 0) {
        break
      }

      // produce URL for this batch: first batch has no cursor, later have cursor=encode(lastIdOfPrevBatch)
      const cursor = lastId === null ? '' : `?cursor=${encodeURIComponent(encodeCursor(lastId))}`
      urls.push(`${SITE_URL}/sitemaps/sitemap-questions.xml${cursor}`)

      // set lastId to last row's id for next batch
      lastId = data[data.length - 1].id

      // if fewer than limit, we're done
      if (data.length < MAX_URLS_PER_SITEMAP) break
    }

    // if no batches found, still emit one empty sitemap
    if (urls.length === 0) urls.push(`${SITE_URL}/sitemaps/sitemap-questions.xml`)

    const indexEntries = urls.map((u) => `  <sitemap>\n    <loc>${u}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries}\n</sitemapindex>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err: any) {
    console.error('Sitemap index generation error', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
