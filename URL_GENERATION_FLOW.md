# Question URL Generation Flow - Complete Analysis

## Overview
The application uses a sophisticated URL generation system for questions with multi-layer validation and slug-based routing. URLs follow the pattern: `/question/{subject_slug}/{slug}` where slug contains keywords extracted from the question text plus the question ID.

---

## 1. Core URL Generation Functions (lib/slugGenerator.ts)

### 1.1 `generateQuestionSlug(questionText, questionId, language = 'en')`
**Purpose**: Creates a URL-safe slug from question text

**Process**:
1. Extracts text based on language preference (English or Hindi)
2. Normalizes and extracts keywords (up to 7 keywords for English, 6 for Hindi)
3. Combines keywords with question ID: `{keywords}-q{questionId}`

**Example**:
- Input: "Which of the following is a Fundamental Duty?" (id: "112")
- Output: "which-of-the-following-is-a-fundamental-duty-q112"

**Language Support**:
- English: Full text analysis with keyword extraction
- Hindi: Text transliterated to English, then keywords extracted

### 1.2 `buildQuestionPath(subject, questionId, questionText, language = 'en')`
**Purpose**: Builds the complete canonical URL path

**Process**:
1. Slugifies the subject: `/question/{slugifiedSubject}/`
2. Generates the slug using `generateQuestionSlug()`
3. Returns: `/question/{subject_slug}/{slug}`

**Example**:
- Input: subject="Indian Polity", id="112", question="Which Fundamental Duty..."
- Output: `/question/indian-polity/which-of-the-following-is-a-fundamental-duty-q112`

### 1.3 `slugifySubject(subject)`
**Purpose**: Converts subject names to URL-safe slugs

**Process**:
- Converts to lowercase
- Removes special characters, keeping only alphanumeric and hyphens
- Collapses multiple hyphens into single hyphens
- Removes leading/trailing hyphens

**Examples**:
- "Indian Polity" → "indian-polity"
- "General Knowledge" → "general-knowledge"

### 1.4 `extractQuestionIdFromSlug(slug)`
**Purpose**: Reverse process to extract question ID from slug

**Process**:
1. Looks for pattern ending with `-q{digits}`
2. Extracts the number after 'q'
3. Falls back to parsing by splitting on hyphens

**Example**:
- Input: "which-fundamental-duty-q112"
- Output: "112"

### 1.5 Helper Functions

**`extractKeywords(text, language = 'en')`**:
- Removes special characters and normalizes text
- Splits into words and takes first 6-7 words
- For Hindi: Transliterates to English first
- Joins with hyphens

**`getText(value, locale = 'en')`**:
- Handles bilingual text objects
- Returns English or Hindi version based on locale parameter
- Fallback chain: locale → 'en' → 'hi' → first available value

**`transliterateHindiToEnglish(text)`**:
- Maps Hindi characters to English equivalents
- Supports devanagari digits (०-९) and consonants/vowels
- Returns transliterated slug-ready string

---

## 2. Route Handlers and URL Handling

### 2.1 Question Display Route: `app/question/[subject]/[slug]/page.tsx`

**Route Structure**: `/question/{subject}/{slug}`

**URL Handling Flow**:
```
1. Receive URL params (subject, slug)
2. Extract question ID from slug using getQuestionIdFromSlug()
3. Fetch question from database (multiple subject tables)
4. Generate canonical subject slug and slug
5. Compare current URL with canonical URL
6. If mismatch → redirect to canonical URL
7. If match → render question with QuizClient
```

**Redirect Logic**:
```typescript
const currentSubject = decodeURIComponent(resolvedParams.subject).trim();
const currentSlug = decodeURIComponent(resolvedParams.slug).trim();
const questionId = getQuestionIdFromSlug(currentSlug);
const question = await fetchQuestionById(questionId);
const canonicalSubject = slugifySubject(question.subject).trim();
const canonicalSlug = generateQuestionSlug(question.question, question.id).trim();
const correctPath = buildQuestionPath(question.subject, question.id, question.question);

if (currentSubject !== canonicalSubject || currentSlug !== canonicalSlug) {
  return redirect(correctPath);
}
```

**Database Lookup**: Searches through 10 subject-specific tables:
- questions
- history_questions
- science_questions
- polity_questions
- economics_questions
- geography_questions
- general_knowledge_questions
- math_questions
- current_affairs_questions
- reasoning_questions

### 2.2 Quiz Redirect Route: `app/quiz/[id]/page.tsx`

**Purpose**: Provides a simpler entry point for quiz linking

**Process**:
1. Receives a question ID
2. Uses `extractQuestionIdFromSlug()` to parse it
3. Fetches the question
4. Calls `buildQuestionPath()` to get canonical URL
5. Redirects to the canonical question URL

**Used for**: Linking from quiz pages or direct question access

### 2.3 Subject/Topic Route: `app/subjects/[subject]/[topicSlug]/ClientQuiz.tsx`

**Purpose**: Displays questions for a specific topic

**URL Structure**: `/subjects/{subject}/{topicSlug}`

**Question Linking**:
- Uses `buildQuestionPath()` to generate URLs
- Currently used primarily in document title updates
- Client component displays questions inline without navigation to separate pages

---

## 3. Frontend Components and Links

### 3.1 SubjectTopicsClient (`app/subjects/[subject]/SubjectTopicsClient.tsx`)

**Purpose**: Lists topics for a subject

**Links Generated**:
```typescript
const href = `/subjects/${subjectKey}/${encodeURIComponent(topicLabel)}?v=${Date.now()}`;
```

**Pattern**: Each topic links to `/subjects/{subject}/{topic}` where questions are displayed

### 3.2 QuestionCard (`app/components/QuestionCard.tsx`)

**Purpose**: Displays individual question with options

**Current Status**: Does not directly generate question URLs
- Used within topic quiz pages
- Displays question text, options, and explanations
- No navigation to separate question pages

### 3.3 ClientQuiz (`app/subjects/[subject]/[topicSlug]/ClientQuiz.tsx`)

**Purpose**: Client-side quiz interface for topic questions

**URL References**:
- Imports `buildQuestionPath()` and `generateQuestionSlug()`
- Updates document title with question info
- Keeps user on same page (doesn't navigate between questions)

---

## 4. Sitemap Generation

Multiple sitemap routes generate question URLs for SEO:

### 4.1 `app/sitemaps/sitemap-questions/route.ts`

**Functionality**:
- Streams question URLs for search engine crawling
- Pagination support via keyset-based cursors
- Builds URLs: `{SITE_URL}/question/{subjectKey}/{id}/{slug}`
- Local implementation of `generateQuestionSlug()`

**Note**: Uses slightly different format with ID in URL path (older format)

### 4.2 `app/sitemaps/sitemap-questions.xml/route.ts`

**Functionality**:
- XML format sitemap generation
- Similar URL building as above
- Includes lastmod and changefreq metadata

### 4.3 `app/sitemaps/[part]/route.ts`

**Functionality**:
- Paginated sitemap generation
- Supports multiple subject tables
- Follows same URL pattern as other sitemaps

### 4.4 Sitemap Configuration: `next-sitemap.config.js`

**Purpose**: Next.js sitemap plugin configuration

**Question URL Generation in additionalPaths**:
```javascript
const quizSlug = generateQuestionSlug(questionText, id)
urls.push({ 
  loc: `${config.siteUrl}/question/${subjectKey}/${id}/${quizSlug}`, 
  priority: 0.7 
})
```

**Note**: This is using the old 3-part URL format with ID in middle

---

## 5. Data Flow from Questions to URLs

```
┌─────────────────────┐
│  Questions JSON     │
│  or Supabase DB     │
└──────────┬──────────┘
           │
           ├─→ [Question fields: id, subject, question, topic, ...]
           │
┌──────────▼────────────────────────────┐
│  Fetch Questions                       │
│  (By Subject or Topic)                 │
└──────────┬─────────────────────────────┘
           │
           ├─→ [Question list for display]
           │
┌──────────▼──────────────────────────────────────────┐
│  URL Generation (Where applicable)                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ 1. Slugify Subject                          │   │
│  │    "Indian Polity" → "indian-polity"        │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 2. Generate Question Slug                   │   │
│  │    Text: "Which Duty is..." + ID: "112"     │   │
│  │    → "which-duty-is-q112"                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 3. Build Full Path                          │   │
│  │    /question/indian-polity/which-duty-is... │   │
│  └─────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────────┘
           │
           ├─→ [Final URL ready for display/navigation]
           │
┌──────────▼──────────────────────────────────────────┐
│  Usage Points                                        │
│  • Sitemaps (SEO)                                   │
│  • QuizClient page title                           │
│  • Redirect verification                           │
│  • Link generation (future)                        │
└──────────────────────────────────────────────────────┘
```

---

## 6. All Files Generating/Using Question URLs

### Files That Generate URLs:
1. **lib/slugGenerator.ts** - Core URL generation functions
   - `generateQuestionSlug()`
   - `buildQuestionPath()`
   - `slugifySubject()`
   - `extractQuestionIdFromSlug()`

2. **app/question/[subject]/[slug]/page.tsx** - Question display page
   - Validates and redirects to canonical URLs
   - Uses all slug/path functions

3. **app/quiz/[id]/page.tsx** - Quiz redirect endpoint
   - Extracts ID from slug
   - Calls `buildQuestionPath()`

4. **app/subjects/[subject]/[topicSlug]/ClientQuiz.tsx** - Quiz display
   - Uses `buildQuestionPath()` in document title
   - Uses `generateQuestionSlug()` for title updates

5. **Sitemap Routes** (3 different implementations)
   - app/sitemaps/sitemap-questions/route.ts
   - app/sitemaps/sitemap-questions.xml/route.ts
   - app/sitemaps/[part]/route.ts
   - next-sitemap.config.js

### Files That Link to Questions:
1. **app/subjects/[subject]/SubjectTopicsClient.tsx**
   - Links to `/subjects/{subject}/{topic}` topic pages
   - Not directly linking to individual questions (they're displayed inline)

2. **app/quiz/[id]/QuizClient.tsx** (line 75)
   - Contains a link: `href={"/question/${slugifySubject(question.subject)}"}`
   - Only links to subject page, not individual question

---

## 7. URL Structure Inconsistencies Found

### Current vs. Old Formats:

**Current Format** (in app/question/[subject]/[slug]/page.tsx):
```
/question/{subject_slug}/{slug}
```
Example: `/question/indian-polity/which-duty-is-fundamental-q112`

**Sitemap/Old Format** (in sitemap routes and config):
```
/question/{subject_key}/{id}/{slug}
```
Example: `/question/polity/112/which-duty-is-fundamental-q112`

**Note**: The 2-part format (current) is correct and validated by the question page route. The 3-part format in sitemaps may need updating to match the canonical 2-part format.

---

## 8. Key Validation Mechanisms

### 8.1 Canonical URL Verification
The question page route ensures URLs are canonical by:
1. Extracting question ID from slug
2. Fetching the actual question
3. Regenerating the canonical slug
4. Comparing with provided slug
5. Redirecting if mismatch

### 8.2 Language Support
- Question text can be in English or Hindi
- Slugs are generated based on language preference
- Hindi text is transliterated to English for URL-safe slugs

### 8.3 Bilingual Data Handling
- Questions can have localized text: `{ en: "...", hi: "..." }`
- URLs use English keywords for consistency
- Display language is separate from URL language

---

## 9. Data Flow Diagram for Individual Question

```
User visits: /question/indian-polity/which-duty-is-fundamental-q112
                        ↓
           Extract: subject="indian-polity", slug="which-duty-is-fundamental-q112"
                        ↓
           Extract question ID: "112" from slug
                        ↓
           Query database: SELECT * FROM history_questions WHERE id = "112"
                        ↓
           Fetch question object with all fields
                        ↓
           Generate canonical subject: "indian-polity"
           Generate canonical slug: "which-duty-is-fundamental-q112"
                        ↓
           Compare current vs. canonical
                        ↓
        ┌─ If match → Display question
        │
        └─ If mismatch → Redirect to buildQuestionPath()
           (which rebuilds correct URL)
                        ↓
           Display QuizClient component with question data
```

---

## 10. Technology Stack Used

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **URL Handling**: Next.js dynamic routes with parameters
- **Validation**: Server-side slug validation and redirects
- **Database**: Supabase (multiple subject-specific tables)
- **SEO**: Sitemap generation with pagination support

---

## 11. Summary

The URL generation system is well-designed with:
- **Consistent slug generation** from question text + ID
- **Multi-layer validation** ensuring URLs are canonical
- **Language support** for both English and Hindi
- **SEO optimization** through sitemap generation
- **Database fallback** for data retrieval
- **Flexible querying** across 10 subject-specific tables

The main implementation location is **lib/slugGenerator.ts**, which provides all necessary URL generation and parsing functions used throughout the application.
