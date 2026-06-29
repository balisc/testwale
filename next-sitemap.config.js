/** @type {import('next-sitemap').IConfig} */
const fs = require('fs')
const path = require('path')
const questionsData = require('./data/questions.json')
const { createClient } = require('@supabase/supabase-js')

function loadEnvFile(envFile) {
  try {
    const data = fs.readFileSync(envFile, 'utf8')
    for (const line of data.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const equalsIndex = trimmed.indexOf('=')
      if (equalsIndex === -1) continue
      const key = trimmed.slice(0, equalsIndex).trim()
      const value = trimmed.slice(equalsIndex + 1).trim()
      if (key && value && !process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // ignore missing env files
  }
}

loadEnvFile(path.join(__dirname, '.env.local'))
loadEnvFile(path.join(__dirname, '.env'))

const SUBJECT_TABLES = [
  'history_questions',
  'science_questions',
  'polity_questions',
  'economics_questions',
  'geography_questions',
  'general_knowledge_questions',
  'math_questions',
  'current_affairs_questions',
  'reasoning_questions',
]

const SUBJECT_PATHS = {
  history_questions: 'history',
  science_questions: 'science',
  polity_questions: 'polity',
  economics_questions: 'economics',
  geography_questions: 'geography',
  general_knowledge_questions: 'general-knowledge',
  math_questions: 'math',
  current_affairs_questions: 'current-affairs',
  reasoning_questions: 'reasoning',
}

function slugify(value) {
  if (!value) return ''
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function getText(value, locale = 'en') {
  if (typeof value === 'string') return value
  return (value && value[locale]) || (value && value.en) || (value && value.hi) || (value && Object.values(value)[0]) || ''
}

function extractKeywords(text) {
  const words = String(text || '')
    .replace(/[^\n\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 7)

  return words.length >= 6 ? words.slice(0, 7).join('-') : words.join('-')
    .toLowerCase()
}

function stripTopicPrefix(text) {
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

function generateQuestionSlug(questionText, questionId) {
  const text = stripTopicPrefix(getText(questionText, 'en'))
  const keywords = extractKeywords(text || `question-${questionId}`)
  return `${keywords}-${questionId}`
}

function getTopicValue(row) {
  if (!row) return null
  if (typeof row.topic === 'string') return row.topic
  if (row.topic && typeof row.topic === 'object') return row.topic.en ?? row.topic.hi ?? Object.values(row.topic)[0]
  return row.topic_en ?? row.topic_hi ?? row.topic
}

function buildSubjectPath(subjectKey) {
  return `/${slugify(subjectKey)}`
}

function buildTopicPath(subjectKey, topic) {
  return `/${slugify(subjectKey)}/topics/${slugify(topic)}`
}

function buildQuestionPath(topic, questionText, id) {
  const topicSlug = slugify(topic)
  const questionSlug = generateQuestionSlug(questionText, id)
  return topicSlug ? `/question/${topicSlug}/${questionSlug}` : `/question/${questionSlug}`
}

function getSupabaseClient() {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const url = rawUrl.replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '')
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '').trim()

  if (!url || !key) {
    return null
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

function isMissingTableError(error) {
  return typeof error?.message === 'string' && /Could not find the table/i.test(error.message)
}

async function fetchAllQuestions() {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return questionsData.map((question) => ({
      ...question,
      sourceTable: `${String(question.subject).replace(/-/g, '_')}_questions`,
    }))
  }

  const questions = []
  let missingTableCount = 0

  for (const table of SUBJECT_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('id,question,topic,subject').order('id', { ascending: true })
      if (error) {
        if (isMissingTableError(error)) {
          missingTableCount += 1
          continue
        }
        console.warn(`Failed to query ${table}:`, error.message)
        continue
      }
      if (Array.isArray(data)) {
        questions.push(...data.map((row) => ({ ...row, sourceTable: table })))
      }
    } catch (err) {
      console.warn(`Supabase fetch failed for ${table}:`, err)
    }
  }

  if (questions.length === 0 && missingTableCount === SUBJECT_TABLES.length) {
    return questionsData.map((question) => ({
      ...question,
      sourceTable: `${String(question.subject).replace(/-/g, '_')}_questions`,
    }))
  }

  return questions
}

module.exports = {
  siteUrl: 'https://questionwale.com',
  generateRobotsTxt: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ['/api/*', '/admin/*', '/scripts/*'],
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/loading-test/', '/examples/'] }],
  },
  additionalPaths: async (config) => {
    const urls = []

    for (const subjectKey of Object.values(SUBJECT_PATHS)) {
      urls.push({ loc: `${config.siteUrl}${buildSubjectPath(subjectKey)}`, changefreq: 'weekly', priority: 0.8 })
    }

    const questions = await fetchAllQuestions()

    for (const q of questions) {
      const id = q.id ?? ''
      const questionText = getText(q.question, 'en')
      const subjectKey = SUBJECT_PATHS[q.sourceTable] || slugify(q.subject || '')
      const topic = getTopicValue(q)

      if (id && questionText) {
        urls.push({ loc: `${config.siteUrl}${buildQuestionPath(topic, questionText, id)}`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 })
      }

      if (subjectKey && topic) {
        urls.push({ loc: `${config.siteUrl}${buildTopicPath(subjectKey, topic)}`, changefreq: 'weekly', priority: 0.8 })
      }
    }

    const map = new Map()
    for (const u of urls) {
      if (u && u.loc) map.set(u.loc, u)
    }
    return Array.from(map.values())
  },
}