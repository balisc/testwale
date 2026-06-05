'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../../lib/LanguageContext';
import { slugifySubject } from '@/lib/slugGenerator';

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

const SUBJECT_LABELS: Record<string, { en: string; hi: string }> = {
  history: { en: 'History', hi: 'इतिहास' },
  science: { en: 'Science', hi: 'विज्ञान' },
  polity: { en: 'Polity', hi: 'राजव्यवस्था' },
  economics: { en: 'Economics', hi: 'अर्थशास्त्र' },
  geography: { en: 'Geography', hi: 'भूगोल' },
  'general-knowledge': { en: 'General Knowledge', hi: 'सामान्य ज्ञान' },
  math: { en: 'Math', hi: 'गणित' },
  'current-affairs': { en: 'Current Affairs', hi: 'वर्तमान मामले' },
  reasoning: { en: 'Reasoning', hi: 'तर्क' },
};

const TEXT = {
  en: {
    masterHeader: (subject: string) => `Master ${subject} Topics`,
    subtitle:
      'Build strong subject momentum with focused topic clusters and rich question coverage.',
    pageTitle: (subject: string) => `${subject} Topics`,
    pageDescription: 'Choose a topic to start practicing questions, explanations, and progress tracking.',
    progressLabel: 'YOUR PROGRESS',
    totalQuestionsLabel: 'Total Questions',
    accuracyLabel: 'Accuracy',
    questionsAvailable: 'questions available',
    topicSubtitle: 'Tap a topic to launch the next practice session.',
    featureSoon: 'This feature will be available soon.',
    earlyMedievalTitle: 'Early Medieval India (750 AD – 1200 AD)',
    earlyMedievalDescription: 'Click to open the core medieval history topics and review question counts.',
    dropdownHeader: 'Medieval India Topics',
    delhiSultanateTitle: 'Delhi Sultanate (1206 AD – 1526 AD)',
    delhiSultanateDescription: 'Click to open the Delhi Sultanate subtopics and review question counts.',
    vijayanagarTitle: 'Vijayanagar and Bahmani Kingdoms (1336 AD – 1646 AD)',
    vijayanagarDescription: 'Click to open the Vijayanagar and Bahmani Kingdoms subtopics and review question counts.',
    bhaktiSufiTitle: 'Bhakti and Sufi Movements (8th Century – 18th Century)',
    bhaktiSufiDescription: 'Click to open the Bhakti and Sufi Movement subtopics and review question counts.',
    mughalTitle: 'Mughal Empire (1526–1707 AD)',
    mughalDescription: 'Click to open the Mughal Empire subtopics and review question counts.',
    marathaTitle: 'Maratha Empire (1674 AD – 1818 AD)',
    marathaDescription: 'Click to open the Maratha Empire subtopics and review question counts.',
  },
  hi: {
    masterHeader: (subject: string) => `मास्टर ${subject} टॉपिक`,
    subtitle:
      'केंद्रित विषय क्लस्टरों के साथ अभ्यास को मजबूत करें और प्रश्न कवरेज बढ़ाएँ।',
    pageTitle: (subject: string) => `${subject} टॉपिक्स`,
    pageDescription: 'एक विषय चुनें और प्रश्नों, व्याख्याओं और प्रगति को देखें।',
    progressLabel: 'आपकी प्रगति',
    totalQuestionsLabel: 'कुल प्रश्न',
    accuracyLabel: 'सटीकता',
    questionsAvailable: 'प्रश्न उपलब्ध',
    topicSubtitle: 'अगला अभ्यास सत्र शुरू करने के लिए एक विषय पर टैप करें।',
    featureSoon: 'यह सुविधा जल्द ही उपलब्ध होगी।',
    earlyMedievalTitle: 'आर्ली मीडीवल इंडिया (750 ईस्वी – 1200 ईस्वी)',
    earlyMedievalDescription: 'मुख्य मध्यकालीन इतिहास टॉपिक खोलने के लिए क्लिक करें और प्रश्नों की संख्या देखें।',
    delhiSultanateTitle: 'दिल्ली सल्तनत (1206 ईस्वी – 1526 ईस्वी)',
    delhiSultanateDescription: 'दिल्ली सल्तनत के उपविषयों को खोलें और प्रश्नों की संख्या देखें।',
    vijayanagarTitle: 'विजयनगर और बहमनी साम्राज्य (1336 ईस्वी – 1646 ईस्वी)',
    vijayanagarDescription: 'विजयनगर और बहमनी साम्राज्य उपविषयों को खोलें और प्रश्नों की संख्या देखें।',
    bhaktiSufiTitle: 'भक्ति और सूफी आंदोलन (8वीं शताब्दी – 18वीं शताब्दी)',
    bhaktiSufiDescription: 'भक्ति और सूफी आंदोलन उपविषयों को खोलें और प्रश्नों की संख्या देखें।',
    mughalTitle: 'मुगल साम्राज्य (1526–1707 ईस्वी)',
    mughalDescription: 'मुगल साम्राज्य उपविषयों को खोलें और प्रश्नों की संख्या देखें।',
    marathaTitle: 'मराठा साम्राज्य (1674 ईस्वी – 1818 ईस्वी)',
    marathaDescription: 'मराठा साम्राज्य उपविषयों को खोलें और प्रश्नों की संख्या देखें।',
    dropdownHeader: 'मध्यकालीन भारत के विषय',
  },
};

const EARLY_MEDIEVAL_TOPICS = [
  {
    label: {
      en: 'Tripartite Struggle for Kannauj (Palas, Pratiharas, and Rashtrakutas)',
      hi: 'कन्नौज के लिए त्रिपक्षीय संघर्ष (पाल, प्रतिहार और राष्ट्रकूट)',
    },
  },
  {
    label: {
      en: 'The Rajput Clans: Polity, Society, and Feudalism',
      hi: 'राजपूत कुल: राजव्यवस्था, समाज और सामंतवाद',
    },
  },
  {
    label: {
      en: 'The Chola Empire: Administration and Maritime Power',
      hi: 'चोल साम्राज्य: प्रशासन और समुद्री शक्ति',
    },
  },
];

const DELHI_SULTANATE_TOPICS = [
  {
    label: {
      en: 'Slave Dynasty',
      hi: 'गुलाम वंश',
    },
  },
  {
    label: {
      en: 'Khalji Dynasty',
      hi: 'खिलजी वंश',
    },
  },
  {
    label: {
      en: 'Tughlaq Dynasty',
      hi: 'तुगलक वंश',
    },
  },
  {
    label: {
      en: 'Sayyid Dynasty',
      hi: 'सैय्यद वंश',
    },
  },
  {
    label: {
      en: 'Lodi Dynasty',
      hi: 'लोदी वंश',
    },
  },
  {
    label: {
      en: 'Administration, Art, and Literature',
      hi: 'सल्तनत कालीन प्रशासन, कला और साहित्य',
    },
  },
];

const VIJAYANAGAR_TOPICS = [
  {
    label: {
      en: 'The Vijayanagar Empire: Polity & Dynasties',
      hi: 'विजयनगर साम्राज्य: राजवंश और राजनीतिक इतिहास',
    },
  },
  {
    label: {
      en: 'Vijayanagar Administration, Economy & Culture',
      hi: 'विजयनगर प्रशासन, अर्थव्यवस्था और संस्कृति',
    },
  },
  {
    label: {
      en: 'The Bahmani Kingdom & Deccan Sultanates',
      hi: 'बहमनी साम्राज्य और दक्कन सल्तनत',
    },
  },
];

const BHAKTI_SUFI_TOPICS = [
  {
    label: {
      en: 'Early Bhakti Movement',
      hi: 'प्रारंभिक भक्ति आंदोलन',
    },
    displayIndex: 1,
  },
  {
    label: {
      en: 'North Indian Bhakti Saints',
      hi: 'उत्तर भारत के भक्ति संत',
    },
    displayIndex: 2,
  },
  {
    label: {
      en: 'Sikhism and Guru Nanak',
      hi: 'सिख धर्म और गुरु नानक देव जी',
    },
    displayIndex: 3,
  },
  {
    label: {
      en: 'Sufism and Major Sufi Saints',
      hi: 'सूफीवाद और प्रमुख सूफी संत',
    },
    displayIndex: 4,
  },
  {
    label: {
      en: 'Impact of the Movements',
      hi: 'आंदोलनों का सामाजिक और सांस्कृतिक प्रभाव',
    },
    displayIndex: 6,
  },
];

const MUGHAL_TOPICS = [
  {
    label: {
      en: 'Rise of the Mughal Empire: Babur, Humayun and the Sur Empire',
      hi: 'मुगल साम्राज्य का उदय: बाबर, हुमायूँ और सूर साम्राज्य',
    },
    displayIndex: 1,
  },
  {
    label: {
      en: 'Zenith of the Mughal Empire: Akbar and Jahangir',
      hi: 'मुगल साम्राज्य का चरमोत्कर्ष: अकबर और जहाँगीर',
    },
    displayIndex: 2,
  },
  {
    label: {
      en: 'Consolidation and Decline: Shah Jahan and Aurangzeb',
      hi: 'मुगल साम्राज्य का सुदृढ़ीकरण एवं पतन: शाहजहाँ और औरंगज़ेब',
    },
    displayIndex: 3,
  },
  {
    label: {
      en: 'Mughal Administration, Mansabdari and Revenue System',
      hi: 'मुगल प्रशासन, मनसबदारी एवं भू-राजस्व व्यवस्था',
    },
    displayIndex: 4,
  },
  {
    label: {
      en: 'Mughal Culture: Architecture, Painting and Literature',
      hi: 'मुगल संस्कृति: वास्तुकला, चित्रकला एवं साहित्य',
    },
    displayIndex: 5,
  },
];

const MARATHA_TOPICS = [
  {
    label: {
      en: 'Rise of Marathas & Chhatrapati Shivaji Maharaj',
      hi: 'मराठा साम्राज्य का उदय और छत्रपति शिवाजी महाराज',
    },
    displayIndex: 1,
  },
  {
    label: {
      en: 'Maratha Administration, Ashtapradhan & Revenue',
      hi: 'मराठा प्रशासन, अष्टप्रधान और राजस्व प्रणाली',
    },
    displayIndex: 2,
  },
  {
    label: {
      en: 'The Age of Peshwas, Maratha Confederacy & Decline',
      hi: 'पेशवाओं का काल, मराठा परिसंघ और पतन',
    },
    displayIndex: 3,
  },
];

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

function getTopicLabel(topic: { label: { en: string; hi: string } }, lang: 'en' | 'hi') {
  return lang === 'hi' ? topic.label.hi || topic.label.en : topic.label.en || topic.label.hi;
}

export default function SubjectTopicsClient({
  subjectKey,
  topics,
  subCategory,
}: {
  subjectKey: string;
  topics: TopicItem[];
  subCategory?: string;
}) {
  const { language } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDelhiSultanateOpen, setIsDelhiSultanateOpen] = useState(false);
  const [isVijayanagarOpen, setIsVijayanagarOpen] = useState(false);
  const [isBhaktiSufiOpen, setIsBhaktiSufiOpen] = useState(false);
  const [isMughalOpen, setIsMughalOpen] = useState(false);
  const [isMarathaOpen, setIsMarathaOpen] = useState(false);
  const lang = language;
  const labels = TEXT[lang];
  const subjectLabel = SUBJECT_LABELS[subjectKey]?.[lang] ?? SUBJECT_LABELS[subjectKey]?.en ?? subjectKey;
  const isEarlyMedieval = subjectKey === 'history' && subCategory === 'medieval';

  const getTopicCount = (label: string) => {
    const normalizedLabel = normalizeText(label);
    const match = topics.find((topic) => {
      return [topic.en, topic.hi].some((text) => normalizeText(text || '') === normalizedLabel);
    });
    return match?.count ?? 0;
  };

  const earlyMedievalItems = EARLY_MEDIEVAL_TOPICS.map((topic, index) => {
    const count = getTopicCount(topic.label.en);
    return {
      ...topic,
      count,
      index: index + 1,
      href: `/${subjectKey}/topics/${slugifySubject(topic.label.en)}`,
    };
  });

  const earlyMedievalTopicSet = new Set(
    earlyMedievalItems.flatMap((item) => [
      normalizeText(item.label.en),
      normalizeText(item.label.hi),
    ])
  );

  const delhiSultanateItems = DELHI_SULTANATE_TOPICS.map((topic, index) => {
    const count = getTopicCount(topic.label.en);
    return {
      ...topic,
      count,
      index: index + 1,
      href: `/${subjectKey}/topics/${slugifySubject(topic.label.en)}`,
    };
  });

  const delhiSultanateTopicSet = new Set(
    delhiSultanateItems.flatMap((item) => [
      normalizeText(item.label.en),
      normalizeText(item.label.hi),
    ])
  );

  const vijayanagarItems = VIJAYANAGAR_TOPICS.map((topic, index) => {
    const count = getTopicCount(topic.label.en);
    return {
      ...topic,
      count,
      index: index + 1,
      href: `/${subjectKey}/topics/${slugifySubject(topic.label.en)}`,
    };
  });

  const vijayanagarTopicSet = new Set(
    vijayanagarItems.flatMap((item) => [
      normalizeText(item.label.en),
      normalizeText(item.label.hi),
    ])
  );

  const bhaktiSufiItems = BHAKTI_SUFI_TOPICS.map((topic) => {
    const count = getTopicCount(topic.label.en);
    return {
      ...topic,
      count,
      index: topic.displayIndex ?? 0,
      href: `/${subjectKey}/topics/${slugifySubject(topic.label.en)}`,
    };
  });

  const bhaktiSufiTopicSet = new Set(
    bhaktiSufiItems.flatMap((item) => [
      normalizeText(item.label.en),
      normalizeText(item.label.hi),
    ])
  );

  const mughalItems = MUGHAL_TOPICS.map((topic) => {
    const count = getTopicCount(topic.label.en);
    return {
      ...topic,
      count,
      index: topic.displayIndex ?? 0,
      href: `/${subjectKey}/topics/${slugifySubject(topic.label.en)}`,
    };
  });

  const mughalTopicSet = new Set(
    mughalItems.flatMap((item) => [
      normalizeText(item.label.en),
      normalizeText(item.label.hi),
    ])
  );

  const marathaItems = MARATHA_TOPICS.map((topic) => {
    const count = getTopicCount(topic.label.en);
    return {
      ...topic,
      count,
      index: topic.displayIndex ?? 0,
      href: `/${subjectKey}/topics/${slugifySubject(topic.label.en)}`,
    };
  });

  const marathaTopicSet = new Set(
    marathaItems.flatMap((item) => [
      normalizeText(item.label.en),
      normalizeText(item.label.hi),
    ])
  );

  const earlyMedievalTotalQuestions = earlyMedievalItems.reduce((sum, item) => sum + item.count, 0);
  const delhiSultanateTotalQuestions = delhiSultanateItems.reduce((sum, item) => sum + item.count, 0);
  const vijayanagarTotalQuestions = vijayanagarItems.reduce((sum, item) => sum + item.count, 0);
  const bhaktiSufiTotalQuestions = bhaktiSufiItems.reduce((sum, item) => sum + item.count, 0);
  const mughalTotalQuestions = mughalItems.reduce((sum, item) => sum + item.count, 0);
  const marathaTotalQuestions = marathaItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 pt-6 pb-8 items-start">
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] overflow-hidden">
          <div className="h-full bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 p-6 rounded-3xl shadow-sm">
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {labels.masterHeader(subjectLabel)}
              </h2>
              <p className="text-sm text-slate-500 leading-6">
                Select a topic below to test your limits. Continuous revision leads to an elite rank.
              </p>
                <div className="rounded-3xl bg-white border border-slate-100 p-6 space-y-4">
                  <div className="text-xs text-slate-500 uppercase tracking-[0.24em] font-semibold">
                    {labels.progressLabel}
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">{labels.featureSoon}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-[0.18em] font-semibold">{labels.totalQuestionsLabel}</div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">{topics.reduce((s, t) => s + (t.count ?? 0), 0).toLocaleString()}</div>
                  </div>
                </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 col-span-1 w-full min-h-screen pb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {labels.pageTitle(subjectLabel)}
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-2xl leading-7">
              {labels.topicSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            {isEarlyMedieval && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((state) => !state)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                      {labels.dropdownHeader}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {labels.earlyMedievalTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                      {labels.earlyMedievalDescription}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {earlyMedievalItems.length} topics · {earlyMedievalTotalQuestions} questions total
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {isDropdownOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isDropdownOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 px-5 pb-4">
                    {earlyMedievalItems.map((item) => {
                      const displayLabel = getTopicLabel(item, lang);
                      return (
                        <Link
                          key={displayLabel}
                          href={item.href}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{`Topic ${item.index}: ${displayLabel}`}</p>
                              <p className="mt-1 text-xs text-slate-500">{`${item.count} ${labels.questionsAvailable}`}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isEarlyMedieval && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsDelhiSultanateOpen((state) => !state)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                      {labels.dropdownHeader}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {labels.delhiSultanateTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                      {labels.delhiSultanateDescription}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {delhiSultanateItems.length} topics · {delhiSultanateTotalQuestions} questions total
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {isDelhiSultanateOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isDelhiSultanateOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 px-5 pb-4">
                    {delhiSultanateItems.map((item) => {
                      const displayLabel = getTopicLabel(item, lang);
                      return (
                        <Link
                          key={displayLabel}
                          href={item.href}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{`Topic ${item.index}: ${displayLabel}`}</p>
                              <p className="mt-1 text-xs text-slate-500">{`${item.count} ${labels.questionsAvailable}`}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isEarlyMedieval && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsVijayanagarOpen((state) => !state)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                      {labels.dropdownHeader}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {labels.vijayanagarTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                      {labels.vijayanagarDescription}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {vijayanagarItems.length} topics · {vijayanagarTotalQuestions} questions total
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {isVijayanagarOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isVijayanagarOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 px-5 pb-4">
                    {vijayanagarItems.map((item) => {
                      const displayLabel = getTopicLabel(item, lang);
                      return (
                        <Link
                          key={displayLabel}
                          href={item.href}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{`Topic ${item.index}: ${displayLabel}`}</p>
                              <p className="mt-1 text-xs text-slate-500">{`${item.count} ${labels.questionsAvailable}`}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isEarlyMedieval && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsBhaktiSufiOpen((state) => !state)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                      {labels.dropdownHeader}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {labels.bhaktiSufiTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                      {labels.bhaktiSufiDescription}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {bhaktiSufiItems.length} topics · {bhaktiSufiTotalQuestions} questions total
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {isBhaktiSufiOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isBhaktiSufiOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 px-5 pb-4">
                    {bhaktiSufiItems.map((item) => {
                      const displayLabel = getTopicLabel(item, lang);
                      return (
                        <Link
                          key={displayLabel}
                          href={item.href}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{`Topic ${item.index}: ${displayLabel}`}</p>
                              <p className="mt-1 text-xs text-slate-500">{`${item.count} ${labels.questionsAvailable}`}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isEarlyMedieval && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMughalOpen((state) => !state)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                      {labels.dropdownHeader}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {labels.mughalTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                      {labels.mughalDescription}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {mughalItems.length} topics · {mughalTotalQuestions} questions total
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {isMughalOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isMughalOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 px-5 pb-4">
                    {mughalItems.map((item) => {
                      const displayLabel = getTopicLabel(item, lang);
                      return (
                        <Link
                          key={displayLabel}
                          href={item.href}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{`Topic ${item.index}: ${displayLabel}`}</p>
                              <p className="mt-1 text-xs text-slate-500">{`${item.count} ${labels.questionsAvailable}`}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isEarlyMedieval && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMarathaOpen((state) => !state)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                      {labels.dropdownHeader}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {labels.marathaTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                      {labels.marathaDescription}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {marathaItems.length} topics · {marathaTotalQuestions} questions total
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                    {isMarathaOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isMarathaOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 px-5 pb-4">
                    {marathaItems.map((item) => {
                      const displayLabel = getTopicLabel(item, lang);
                      return (
                        <Link
                          key={displayLabel}
                          href={item.href}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{`Topic ${item.index}: ${displayLabel}`}</p>
                              <p className="mt-1 text-xs text-slate-500">{`${item.count} ${labels.questionsAvailable}`}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {topics.map((topic, index) => {
              const topicLabel = lang === 'hi' ? topic.hi || topic.en : topic.en || topic.hi;
              const normalizedTopicLabel = normalizeText(topicLabel);
              if (
                isEarlyMedieval &&
                (earlyMedievalTopicSet.has(normalizedTopicLabel) || delhiSultanateTopicSet.has(normalizedTopicLabel) || vijayanagarTopicSet.has(normalizedTopicLabel) || bhaktiSufiTopicSet.has(normalizedTopicLabel) || mughalTopicSet.has(normalizedTopicLabel) || marathaTopicSet.has(normalizedTopicLabel))
              ) {
                return null;
              }

              const questionLabel = `${topic.count ?? 45} ${labels.questionsAvailable}`;
              const href = `/${subjectKey}/topics/${slugifySubject(topicLabel)}`;

              return (
                <Link
                  key={`${topic.en}||${topic.hi}||${index}`}
                  href={href}
                  className="w-full bg-white border border-slate-100 p-5 rounded-2xl mb-4 shadow-sm flex justify-between items-center group cursor-pointer hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 font-mono font-bold text-sm flex items-center justify-center mr-4 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-slate-800 font-bold text-base group-hover:text-slate-900">
                        {topicLabel}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {questionLabel}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-all duration-300 group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
