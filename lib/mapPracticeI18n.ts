type MapQuestionCopy = {
  en: string;
  hi: string;
};

/** Seed question copy keyed by the legacy Roman-Hindi prompt stored in Supabase. */
const MAP_QUESTION_COPY: Record<string, MapQuestionCopy> = {
  'Map par Mumbai Port ko point out kijiye.': {
    en: 'Select Mumbai Port on the map.',
    hi: 'मानचित्र पर मुंबई बंदरगाह का स्थान चुनिए।',
  },
  'Map par Delhi ko point out kijiye.': {
    en: 'Select Delhi on the map.',
    hi: 'मानचित्र पर दिल्ली का स्थान चुनिए।',
  },
  'Map par Ganga nadi ka Varanasi ke paas sthaan point out kijiye.': {
    en: 'Select the stretch of the Ganga near Varanasi on the map.',
    hi: 'मानचित्र पर वाराणसी के पास गंगा नदी का स्थान चुनिए।',
  },
  'Map par Kaziranga National Park ko point out kijiye.': {
    en: 'Select Kaziranga National Park on the map.',
    hi: 'मानचित्र पर काजीरंगा राष्ट्रीय उद्यान का स्थान चुनिए।',
  },
  'Map par Chennai ko point out kijiye.': {
    en: 'Select Chennai on the map.',
    hi: 'मानचित्र पर चेन्नई का स्थान चुनिए।',
  },
  'Map par Kanyakumari ko point out kijiye.': {
    en: 'Select Kanyakumari on the map.',
    hi: 'मानचित्र पर कन्याकुमारी का स्थान चुनिए।',
  },
  'Map par Strait of Malacca ko point out kijiye.': {
    en: 'Select the Strait of Malacca on the map.',
    hi: 'मानचित्र पर मलक्का जलडमरूमध्य का स्थान चुनिए।',
  },
  'Map par Suez Canal ko point out kijiye.': {
    en: 'Select the Suez Canal on the map.',
    hi: 'मानचित्र पर सुएज नहर का स्थान चुनिए।',
  },
  'Map par Panama Canal ko point out kijiye.': {
    en: 'Select the Panama Canal on the map.',
    hi: 'मानचित्र पर पनामा नहर का स्थान चुनिए।',
  },
  'Map par Nile River ka Cairo ke paas wala region point out kijiye.': {
    en: 'Select the stretch of the Nile near Cairo on the map.',
    hi: 'मानचित्र पर काहिरा के पास नील नदी का क्षेत्र चुनिए।',
  },
  'Map par Mount Everest ko point out kijiye.': {
    en: 'Select Mount Everest on the map.',
    hi: 'मानचित्र पर माउंट एवरेस्ट का स्थान चुनिए।',
  },
  'Current affairs map practice: Red Sea shipping route ka approximate point identify kijiye.': {
    en: 'Identify the approximate point of the Red Sea shipping route on the map.',
    hi: 'मानचित्र पर लाल सागर शिपिंग मार्ग का अनुमानित बिंदु चुनिए।',
  },
  'Current affairs map practice: Baku climate summit venue ko map par point out kijiye.': {
    en: 'Select the Baku climate summit venue on the map.',
    hi: 'मानचित्र पर बाकू जलवायु शिखर सम्मेलन स्थल का स्थान चुनिए।',
  },
};

export function localizeMapQuestionText(
  rawText: string,
  language: 'en' | 'hi',
  both = false,
): string {
  const copy = MAP_QUESTION_COPY[rawText.trim()];
  if (!copy) return rawText;
  if (both) return `${copy.en}\n${copy.hi}`;
  return language === 'hi' ? copy.hi : copy.en;
}

export function enrichMapQuestionCopy<T extends { question_text: string }>(
  question: T,
): T & { question_text_en: string; question_text_hi: string } {
  const copy = MAP_QUESTION_COPY[question.question_text.trim()];
  return {
    ...question,
    question_text_en: copy?.en ?? question.question_text,
    question_text_hi: copy?.hi ?? question.question_text,
  };
}
