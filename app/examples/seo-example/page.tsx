export const metadata = {
  title: 'SEO Example — QuestionWale',
  description: 'Internal example page showing how to add page metadata.',
  alternates: { canonical: 'https://questionwale.com/examples/seo-example' },
  robots: { index: false, follow: false },
}

export default function SeoExample() {
  return (
    <main>
      <h1>SEO Example</h1>
      <p>This internal page demonstrates the Next.js Metadata API.</p>
    </main>
  )
}
