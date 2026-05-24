import React from 'react'
import MetaTags from '../../components/MetaTags'
import { faqSchemaJsonLd } from '../../../lib/faqSchema'

const exampleFaq = [
  { question: 'What is QuestionWale?', answer: 'QuestionWale is a practice site for questions and quizzes.' },
  { question: 'How often is content updated?', answer: 'We update content weekly.' },
]

export const metadata = {
  title: 'SEO Example — QuestionWale',
  description: 'Example page showing how to add meta tags and FAQ schema.',
  alternates: { canonical: 'https://questionwale.com/examples/seo-example' },
}

export default function SeoExample() {
  return (
    <>
      <MetaTags
        title={String(metadata.title)}
        description={String(metadata.description)}
        canonical={String((metadata as any).alternates.canonical)}
        openGraph={{ title: String(metadata.title), description: String(metadata.description), url: 'https://questionwale.com/examples/seo-example' }}
      />

      <main>
        <h1>SEO Example</h1>
        <p>This page demonstrates MetaTags component and injecting JSON-LD for FAQ.</p>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchemaJsonLd(exampleFaq) }} />
      </main>
    </>
  )
}
