import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QuestionWale — Government Exam MCQ Practice',
    short_name: 'QuestionWale',
    description:
      'Bilingual MCQ practice, revision notes, and syllabus exploration for Indian government exams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#6D28D9',
    icons: [
      {
        src: '/logo/questionwale-mark.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
