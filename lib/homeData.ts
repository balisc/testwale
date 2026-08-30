import { unstable_cache } from 'next/cache';

import { getCatalogSearchSuggestions, getCatalogSiteStats } from './catalogStats';

import { getFastHomepageSubjectCounts } from './subjectCounts';

import { SUBJECTS } from './subjects';



export type HomeStats = {

  questions: number | null;

  subjects: number | null;

  topics: number | null;

};



export type HomeSuggestion = {

  subjectKey: string;

  topicEn: string;

  topicHi: string;

};



async function fetchHomeData() {

  const [subjectCounts, suggestions, catalogStats] = await Promise.all([

    getFastHomepageSubjectCounts(),

    getCatalogSearchSuggestions(40).catch(() => [] as HomeSuggestion[]),

    getCatalogSiteStats().catch(() => null),

  ]);



  const questions = Object.values(subjectCounts).reduce((sum, value) => sum + value, 0);

  const subjects = SUBJECTS.filter((s) => (subjectCounts[s.key] ?? 0) > 0).length;



  return {

    stats: {
      questions: catalogStats?.questions ?? questions,
      subjects: catalogStats?.subjects ?? subjects,
      topics: catalogStats?.topics ?? null,
    } satisfies HomeStats,

    subjectCounts,

    suggestions,

  };

}



export const getHomeData = unstable_cache(fetchHomeData, ['home-page-data-v2'], {

  revalidate: 300,

});


