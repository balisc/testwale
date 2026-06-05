import supabase from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

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

function extractKeywords(text: string): string {
  const words = text
    .replace(/[^\n\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 7)

  return words.length >= 6 ? words.slice(0, 7).join('-') : words.join('-')
    .toLowerCase()
}

function stripTopicPrefix(text: string): string {
  const trimmed = String(text || '').trim()
  const match = trimmed.match(/^(.+?)\s*[-:|]\s*(.+)$/)
  if (!match) return trimmed

  const prefix = match[1].trim()
  const remainder = match[2].trim()
  const words = prefix.split(/\s+/).filter(Boolean)
  const questionWords = /^(what|which|who|where|when|why|how|is|are|can|could|should|would|do|does|did|has|have|had|will|shall|क्या|कौन|कहाँ|कैसे|क्यों|कितना|कितनी|क्या|कैसा|कैसी)\b/i

  if (words.length <= 4 && !questionWords.test(prefix)) {
    return remainder || trimmed
  }

  return trimmed
}

function generateQuestionSlug(questionText: string, questionId: string): string {
  const keywords = extractKeywords(stripTopicPrefix(questionText))
  return `${keywords}-${questionId}`
}

export async function GET(req: Request, { params }: { params: { part: string } }) {
  // Authorization removed - sitemaps are public
  // if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 })

  try {
    // accept part like "1" or "sitemap-questions-1.xml"
    const m = String(params.part).match(/(\d+)/)
    const partNum = m ? parseInt(m[1], 10) : NaN
    if (Number.isNaN(partNum) || partNum < 1) return new Response('Not Found', { status: 404 })

    const skip = (partNum - 1) * MAX_URLS_PER_SITEMAP
    const from = skip
    const to = skip + MAX_URLS_PER_SITEMAP - 1

    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    const footer = '\n</urlset>'

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(header))

        const now = new Date().toISOString()
        if (partNum === 1) {
          const staticPages = ['/', '/subjects', '/practice', '/contact', '/history', '/questions']
          for (const p of staticPages) {
            const url = `${SITE_URL}${p}`
            const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${url === `${SITE_URL}/` ? '1.0' : '0.7'}</priority>\n  </url>\n`
            controller.enqueue(new TextEncoder().encode(entry))
          }
        }

        // fetch page of question slugs
        const { data, error } = await supabase
          .from('history_questions')
          .select('*', { count: 'exact', head: false })
          .order('id', { ascending: true })
          .range(from, to)

        if (error) throw error

        for (const doc of data || []) {
          const questionText = doc.question && typeof doc.question === 'object'
            ? doc.question.en || doc.question.hi || JSON.stringify(doc.question)
            : String(doc.question || doc.topic || '')
          const slug = generateQuestionSlug(questionText, doc.id)
          const url = `${SITE_URL}/question/${slug}`
          const lastmod = doc.created_at ? new Date(doc.created_at).toISOString() : now
          const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`
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
    console.error('Sitemap part generation error', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
