import React from 'react'
import { faqSchemaJsonLd } from '../../../lib/faqSchema'

const exampleFaq = [
  { question: 'What is QuestionWale?', answer: 'QuestionWale is a practice site for questions and quizzes.' },
  { question: 'How often is content updated?', answer: 'We update content weekly.' },
]

export const metadata = {
  title: 'SEO Example — QuestionWale',
  description: 'Example page showing how to add meta tags and FAQ schema.',
  alternates: { canonical: 'https://questionwale.com/examples/seo-example' },
  robots: { index: false, follow: false },
}

export default function SeoExample() {
  return (
    <main>
      <h1>SEO Example</h1>
      <p>This page demonstrates Metadata API and injecting JSON-LD for FAQ.</p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchemaJsonLd(exampleFaq) }} />
    </main>
  )
}
