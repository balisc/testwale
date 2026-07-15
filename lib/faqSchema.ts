type FAQItem = {
  question: string
  answer: string
}

export function faqSchema(items: FAQItem[]) {
  const mainEntity = items.map((it) => ({
    '@type': 'Question',
    name: it.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: it.answer,
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}

export function faqSchemaJsonLd(items: FAQItem[]) {
  return JSON.stringify(faqSchema(items))
}
