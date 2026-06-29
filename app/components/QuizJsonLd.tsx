type QuizJsonLdProps = {
  quizName: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  pageUrl: string;
};

export default function QuizJsonLd({ quizName, questionText, options, correctAnswer, pageUrl }: QuizJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quizName,
    description: `Practice quiz question from ${quizName} on Questionwale.`,
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
        acceptedAnswer: {
          '@type': 'Answer',
          text: correctAnswer,
        },
      },
    ],
  };

  return (
    <script
      id="questionwale-quiz-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
