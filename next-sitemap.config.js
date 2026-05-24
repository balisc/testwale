/** @type {import('next-sitemap').IConfig} */
const questions = require('./data/questions.json')

function slugify(s) {
  if (!s) return ''
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

module.exports = {
  siteUrl: 'https://questionwale.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ['/api/*', '/admin/*'],
  additionalPaths: async (config) => {
    const urls = []
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (q.id) urls.push({ loc: `${config.siteUrl}/quiz/${q.id}`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 })
        if (q.subject) {
          const s = slugify(q.subject)
          urls.push({ loc: `${config.siteUrl}/questions/${s}`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 })
          if (q.topic) {
            const t = slugify(q.topic)
            urls.push({ loc: `${config.siteUrl}/subjects/${s}/${t}`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 })
          }
        }
      }
    }

    // dedupe by loc
    const map = new Map()
    for (const u of urls) map.set(u.loc, u)
    return Array.from(map.values())
  },
}
