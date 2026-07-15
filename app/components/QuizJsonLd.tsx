type QuizJsonLdProps = {
  quizName: string;
  questionText: string;
  options: string[];
  pageUrl: string;
};

/**
 * Public Quiz JSON-LD without marking the correct answer.
 * Do not pass answer keys into structured data.
 */
export default function QuizJsonLd({ quizName, questionText, options, pageUrl }: QuizJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quizName,
    description: `Practice quiz question from ${quizName} on QuestionWale.`,
    url: pageUrl,
    hasPart: [
      {
        '@type': 'Question',
        name: questionText,
        text: questionText,
        answerCount: options.length,
        suggestedAnswer: options.map((option) => ({
          '@type': 'Answer',
          text: option,
        })),
      },
    ],
  };

  return (
    <script
      id="questionwale-quiz-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
