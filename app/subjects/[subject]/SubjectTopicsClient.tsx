'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../../lib/LanguageContext';
import { slugifySubject } from '@/lib/slugGenerator';
import { topicMatches } from '@/lib/topicMatching';
import StructuredTopicGroups from '@/app/components/StructuredTopicGroups';
import {
  PHYSICAL_GEOGRAPHY_DATA,
  PHYSICAL_GEOGRAPHY_PAGE_TITLE,
  PHYSICAL_GEOGRAPHY_SECTION_LABEL,
} from '@/lib/geography/physicalGeographyData';
import {
  INDIAN_GEOGRAPHY_DATA,
  INDIAN_GEOGRAPHY_PAGE_TITLE,
  INDIAN_GEOGRAPHY_SECTION_LABEL,
} from '@/lib/geography/indianGeographyData';
import {
  WORLD_GEOGRAPHY_DATA,
  WORLD_GEOGRAPHY_PAGE_TITLE,
  WORLD_GEOGRAPHY_SECTION_LABEL,
} from '@/lib/geography/worldGeographyData';
import {
  ENVIRONMENT_ECOLOGY_DATA,
  ENVIRONMENT_ECOLOGY_PAGE_TITLE,
  ENVIRONMENT_ECOLOGY_SECTION_LABEL,
} from '@/lib/geography/environmentEcologyData';
import {
  ECONOMIC_FUNDAMENTALS_DATA,
  ECONOMIC_FUNDAMENTALS_PAGE_TITLE,
  ECONOMIC_FUNDAMENTALS_SCOPE,
  ECONOMIC_FUNDAMENTALS_SECTION_LABEL,
} from '@/lib/economics/economicFundamentalsData';
import {
  NATIONAL_INCOME_MACROECONOMICS_DATA,
  NATIONAL_INCOME_MACROECONOMICS_PAGE_TITLE,
  NATIONAL_INCOME_MACROECONOMICS_SCOPE,
  NATIONAL_INCOME_MACROECONOMICS_SECTION_LABEL,
} from '@/lib/economics/nationalIncomeMacroeconomicsData';
import {
  MONEY_BANKING_FINANCIAL_SYSTEM_DATA,
  MONEY_BANKING_FINANCIAL_SYSTEM_PAGE_TITLE,
  MONEY_BANKING_FINANCIAL_SYSTEM_SCOPE,
  MONEY_BANKING_FINANCIAL_SYSTEM_SECTION_LABEL,
} from '@/lib/economics/moneyBankingFinancialSystemData';
import {
  PUBLIC_FINANCE_DATA,
  PUBLIC_FINANCE_PAGE_TITLE,
  PUBLIC_FINANCE_SCOPE,
  PUBLIC_FINANCE_SECTION_LABEL,
} from '@/lib/economics/publicFinanceData';
import {
  INDIAN_ECONOMY_SECTORS_DATA,
  INDIAN_ECONOMY_SECTORS_PAGE_TITLE,
  INDIAN_ECONOMY_SECTORS_SCOPE,
  INDIAN_ECONOMY_SECTORS_SECTION_LABEL,
} from '@/lib/economics/indianEconomySectorsData';
import {
  ECONOMIC_PLANNING_DEVELOPMENT_DATA,
  ECONOMIC_PLANNING_DEVELOPMENT_PAGE_TITLE,
  ECONOMIC_PLANNING_DEVELOPMENT_SCOPE,
  ECONOMIC_PLANNING_DEVELOPMENT_SECTION_LABEL,
} from '@/lib/economics/economicPlanningDevelopmentData';
import {
  EXTERNAL_SECTOR_DATA,
  EXTERNAL_SECTOR_PAGE_TITLE,
  EXTERNAL_SECTOR_SCOPE,
  EXTERNAL_SECTOR_SECTION_LABEL,
} from '@/lib/economics/externalSectorData';
import {
  INFLATION_EMPLOYMENT_POVERTY_DATA,
  INFLATION_EMPLOYMENT_POVERTY_PAGE_TITLE,
  INFLATION_EMPLOYMENT_POVERTY_SCOPE,
  INFLATION_EMPLOYMENT_POVERTY_SECTION_LABEL,
} from '@/lib/economics/inflationEmploymentPovertyData';
import {
  INTERNATIONAL_ECONOMIC_ORGANIZATIONS_DATA,
  INTERNATIONAL_ECONOMIC_ORGANIZATIONS_PAGE_TITLE,
  INTERNATIONAL_ECONOMIC_ORGANIZATIONS_SCOPE,
  INTERNATIONAL_ECONOMIC_ORGANIZATIONS_SECTION_LABEL,
} from '@/lib/economics/internationalEconomicOrganizationsData';
import {
  NUMBER_SYSTEM_DATA,
  NUMBER_SYSTEM_PAGE_TITLE,
  NUMBER_SYSTEM_SCOPE,
  NUMBER_SYSTEM_SECTION_LABEL,
} from '@/lib/math/numberSystemData';
import {
  ARITHMETIC_DATA,
  ARITHMETIC_PAGE_TITLE,
  ARITHMETIC_SCOPE,
  ARITHMETIC_SECTION_LABEL,
} from '@/lib/math/arithmeticData';
import {
  ALGEBRA_DATA,
  ALGEBRA_PAGE_TITLE,
  ALGEBRA_SCOPE,
  ALGEBRA_SECTION_LABEL,
} from '@/lib/math/algebraData';
import {
  GEOMETRY_MENSURATION_DATA,
  GEOMETRY_MENSURATION_PAGE_TITLE,
  GEOMETRY_MENSURATION_SCOPE,
  GEOMETRY_MENSURATION_SECTION_LABEL,
} from '@/lib/math/geometryMensurationData';
import {
  TRIGONOMETRY_DATA,
  TRIGONOMETRY_PAGE_TITLE,
  TRIGONOMETRY_SCOPE,
  TRIGONOMETRY_SECTION_LABEL,
} from '@/lib/math/trigonometryData';
import {
  DATA_INTERPRETATION_DATA,
  DATA_INTERPRETATION_PAGE_TITLE,
  DATA_INTERPRETATION_SCOPE,
  DATA_INTERPRETATION_SECTION_LABEL,
} from '@/lib/math/dataInterpretationData';
import {
  STATISTICS_PROBABILITY_DATA,
  STATISTICS_PROBABILITY_PAGE_TITLE,
  STATISTICS_PROBABILITY_SCOPE,
  STATISTICS_PROBABILITY_SECTION_LABEL,
} from '@/lib/math/statisticsProbabilityData';
import {
  ADVANCED_MATHEMATICS_DATA,
  ADVANCED_MATHEMATICS_PAGE_TITLE,
  ADVANCED_MATHEMATICS_SCOPE,
  ADVANCED_MATHEMATICS_SECTION_LABEL,
} from '@/lib/math/advancedMathematicsData';
import {
  PHYSICS_DATA,
  PHYSICS_PAGE_TITLE,
  PHYSICS_SCOPE,
  PHYSICS_SECTION_LABEL,
} from '@/lib/science/physicsData';
import {
  CHEMISTRY_DATA,
  CHEMISTRY_PAGE_TITLE,
  CHEMISTRY_SCOPE,
  CHEMISTRY_SECTION_LABEL,
} from '@/lib/science/chemistryData';
import {
  BIOLOGY_DATA,
  BIOLOGY_PAGE_TITLE,
  BIOLOGY_SCOPE,
  BIOLOGY_SECTION_LABEL,
} from '@/lib/science/biologyData';
import {
  GENERAL_SCIENCE_DATA,
  GENERAL_SCIENCE_PAGE_TITLE,
  GENERAL_SCIENCE_SCOPE,
  GENERAL_SCIENCE_SECTION_LABEL,
} from '@/lib/science/generalScienceData';

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

const MODERN_HISTORY_DATA = [
  {
    id: 1,
    title: 'Advent of Europeans & British Expansion (1498–1857) | यूरोपीय शक्तियों का आगमन और ब्रिटिश विस्तार',
    subtopics: [
      'Arrival of European Powers (Portuguese, Dutch, French) | यूरोपीय शक्तियों का आगमन (पुर्तगाली, डच, फ्रांसीसी)',
      'Establishment of the East India Company & Carnatic Wars | ईस्ट इंडिया कंपनी की स्थापना और कर्नाटक युद्ध',
      'Battle of Wandiwash (1760) | वांडीवाश का युद्ध (1760)',
      'British Conquest of Bengal (Battles of Plassey & Buxar) | बंगाल पर ब्रिटिश विजय (प्लासी और बक्सर के युद्ध)',
      'Treaty of Allahabad (1765) & Diwani Rights | इलाहाबाद की संधि (1765) और दीवानी अधिकार',
      'Anglo-Mysore and Anglo-Maratha Wars | आंग्ल-मैसूर और आंग्ल-मराठा युद्ध',
      'Annexation of Punjab and Sindh | पंजाब और सिंध का विलय',
      'Policies of Expansion (Subsidiary Alliance & Doctrine of Lapse) | विस्तार की नीतियाँ (सहायक संधि और व्यपगत का सिद्धांत)',
    ],
  },
  {
    id: 2,
    title: 'British Administrative & Economic Policies (1757–1857) | ब्रिटिश प्रशासनिक एवं आर्थिक नीतियाँ',
    subtopics: [
      'Land Revenue Systems (Zamindari, Ryotwari, Mahalwari) | भू-राजस्व व्यवस्थाएँ (जमींदारी, रैयतवारी, महालवारी)',
      'Commercialization of Agriculture & De-industrialization | कृषि का व्यापारीकरण और विऔद्योगीकरण',
      "The 'Drain of Wealth' Theory (Dadabhai Naoroji, R.C. Dutt) | 'धन का अपवाह' सिद्धांत (दादाभाई नौरोजी, आर.सी. दत्त)",
      'Development of Civil Services, Police, and Judiciary | सिविल सेवा, पुलिस और न्यायपालिका का विकास',
      'Development of Press and Modern Education | प्रेस और आधुनिक शिक्षा का विकास',
      'Development of Railways, Telegraph, and Postal System | रेलवे, तार और डाक व्यवस्था का विकास',
    ],
  },
  {
    id: 3,
    title: 'Early Uprisings & The Revolt of 1857 (1763–1860) | प्रारंभिक विद्रोह और 1857 का विद्रोह',
    subtopics: [
      'Early Peasant and Zamindari Uprisings | प्रारंभिक किसान और जमींदारी विद्रोह',
      'Major Tribal Revolts (Santhal, Munda, Kol) | प्रमुख आदिवासी विद्रोह (संथाल, मुंडा, कोल)',
      'Causes and Origins of the 1857 Revolt | 1857 के विद्रोह के कारण और उत्पत्ति',
      'Key Leaders and Centers of the 1857 Revolt | 1857 के विद्रोह के प्रमुख नेता और केंद्र',
      "Impact and Aftermath (Queen's Proclamation 1858 & Govt of India Act 1858) | प्रभाव और परिणाम (महारानी की उद्घोषणा 1858 एवं भारत शासन अधिनियम 1858)",
      'Indigo Revolt (1859–60) | नील विद्रोह (1859–60)',
    ],
  },
  {
    id: 4,
    title: 'Socio-Religious Reform Movements (19th–20th Century) | सामाजिक-धार्मिक सुधार आंदोलन',
    subtopics: [
      'Hindu Reform Movements — Brahmo Samaj | हिंदू सुधार आंदोलन — ब्रह्म समाज',
      'Hindu Reform Movements — Arya Samaj | हिंदू सुधार आंदोलन — आर्य समाज',
      'Hindu Reform Movements — Ramakrishna Mission | हिंदू सुधार आंदोलन — रामकृष्ण मिशन',
      'Muslim Reform Movements — Aligarh Movement | मुस्लिम सुधार आंदोलन — अलीगढ़ आंदोलन (सर सैयद अहमद खान)',
      'Sikh and Parsi Reform Movements | सिख और पारसी सुधार आंदोलन',
      'Theosophical Society | थियोसोफिकल सोसाइटी',
      'Lower Caste and Anti-Brahmin Movements (Jyotiba Phule, Periyar, Ambedkar) | निम्न जाति और ब्राह्मणेतर आंदोलन (ज्योतिबा फुले, पेरियार, अंबेडकर)',
      'Women\'s Upliftment and Social Legislations | महिला उन्नयन और सामाजिक विधान',
      'Key Reformers and their Literature/Journals | प्रमुख सुधारक और उनके साहित्य/पत्रिकाएँ',
    ],
  },
  {
    id: 5,
    title: 'Rise of Nationalism & Moderate Phase (1858–1905) | राष्ट्रवाद का उदय और उदारवादी चरण',
    subtopics: [
      'Factors Leading to Indian Nationalism | भारतीय राष्ट्रवाद के उदय के कारक',
      'Vernacular Press Act (1878) and Ilbert Bill Controversy (1883) | वर्नाक्युलर प्रेस अधिनियम (1878) और इल्बर्ट बिल विवाद (1883)',
      'Political Associations Before the Indian National Congress | भारतीय राष्ट्रीय कांग्रेस से पूर्व राजनीतिक संगठन',
      'Foundation of the Indian National Congress (1885) | भारतीय राष्ट्रीय कांग्रेस की स्थापना (1885)',
      'Ideology, Demands, and Methods of the Moderates | उदारवादियों की विचारधारा, मांगें और तरीके',
      'Indian Councils Act of 1892 | भारतीय परिषद अधिनियम 1892',
    ],
  },
  {
    id: 6,
    title: 'Extremist Phase & Revolutionary Nationalism (1905–1918) | उग्रवादी चरण और क्रांतिकारी राष्ट्रवाद',
    subtopics: [
      'Partition of Bengal and the Swadeshi Movement | बंगाल विभाजन और स्वदेशी आंदोलन',
      'Surat Split and the Rise of Extremism (1907) | सूरत विभाजन और उग्रवाद का उदय (1907), लाल-बाल-पाल त्रिमूर्ति',
      'Formation of the Muslim League (1906) | मुस्लिम लीग की स्थापना (1906)',
      'Early Revolutionary Activities (Mitra Mela, Anushilan Samiti, Ghadar Party) | प्रारंभिक क्रांतिकारी गतिविधियाँ (मित्र मेला, अनुशीलन समिति, गदर पार्टी)',
      'Morley-Minto Reforms (1909) and the Home Rule League Movement | मॉर्ले-मिंटो सुधार (1909) और होम रूल लीग आंदोलन',
    ],
  },
  {
    id: 7,
    title: 'The Gandhian Era & Mass Movements (1915–1947) | गांधीवादी युग और जन आंदोलन',
    subtopics: [
      'Early Satyagrahas (Champaran, Kheda, Ahmedabad Mill Strike) | प्रारंभिक सत्याग्रह (चंपारण, खेड़ा, अहमदाबाद मिल हड़ताल)',
      'Lucknow Pact (1916) | लखनऊ पैक्ट (1916)',
      'Rowlatt Act, Jallianwala Bagh, and the Khilafat Movement | रॉलेट एक्ट, जलियाँवाला बाग और खिलाफत आंदोलन',
      'Non-Cooperation Movement and the Swaraj Party | असहयोग आंदोलन और स्वराज पार्टी',
      'Simon Commission and the Nehru Report | साइमन कमीशन और नेहरू रिपोर्ट',
      'Civil Disobedience Movement & Round Table Conferences | सविनय अवज्ञा आंदोलन और गोलमेज सम्मेलन',
      'Poona Pact (1932) | पूना पैक्ट (1932)',
      'Quit India Movement (1942) and the Indian National Army (INA) | भारत छोड़ो आंदोलन (1942) और आजाद हिंद फौज (INA)',
    ],
  },
  {
    id: 8,
    title: 'Constitutional Developments & Partition (1773–1947) | संवैधानिक विकास और विभाजन',
    subtopics: [
      "Regulating Act (1773) & Pitt's India Act (1784) | रेगुलेटिंग एक्ट (1773) और पिट्स इंडिया एक्ट (1784)",
      'Charter Acts of 1813 and 1833 | चार्टर एक्ट (1813 और 1833)',
      'Charter Act of 1853 | चार्टर एक्ट (1853)',
      'Crown Rule Acts (Govt of India Acts 1858, 1919, 1935) | क्राउन शासन अधिनियम (भारत शासन अधिनियम 1858, 1919, 1935)',
      'August Offer, Cripps Mission, and the Cabinet Mission Plan | अगस्त प्रस्ताव, क्रिप्स मिशन और कैबिनेट मिशन योजना',
      'Growth of Communalism and the Demand for Pakistan | साम्प्रदायिकता का विकास और पाकिस्तान की मांग',
      'Mountbatten Plan and the Indian Independence Act 1947 | माउंटबेटन योजना और भारतीय स्वतंत्रता अधिनियम 1947',
    ],
  },
];

function splitBilingualText(value: string) {
  const [enPart, hiPart] = String(value)
    .split('|')
    .map((part) => part.trim());
  const en = enPart || hiPart || '';
  const hi = hiPart || enPart || '';
  return { en, hi };
}

const normalizeText = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim();

function getTopicLabel(topic: { label: { en: string; hi: string } }, lang: 'en' | 'hi') {
  return lang === 'hi' ? topic.label.hi || topic.label.en : topic.label.en || topic.label.hi;
}

function getTopicCountText(count: number, labels: (typeof TEXT)['en']) {
  return `${count} ${labels.questionsAvailable}`;
}

export default function SubjectTopicsClient({
  subjectKey,
  topics,
  subCategory,
  category,
}: {
  subjectKey: string;
  topics: TopicItem[];
  subCategory?: string;
  category?: string;
}) {
  const { language } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDelhiSultanateOpen, setIsDelhiSultanateOpen] = useState(false);
  const [isVijayanagarOpen, setIsVijayanagarOpen] = useState(false);
  const [isBhaktiSufiOpen, setIsBhaktiSufiOpen] = useState(false);
  const [isMughalOpen, setIsMughalOpen] = useState(false);
  const [isMarathaOpen, setIsMarathaOpen] = useState(false);
  const [modernHistoryData] = useState(MODERN_HISTORY_DATA);
  const [openModernCardId, setOpenModernCardId] = useState<number | null>(MODERN_HISTORY_DATA[0]?.id ?? null);
  const lang = language;
  const labels = TEXT[lang];
  const subjectLabel = SUBJECT_LABELS[subjectKey]?.[lang] ?? SUBJECT_LABELS[subjectKey]?.en ?? subjectKey;
  const isEarlyMedieval = subjectKey === 'history' && subCategory === 'medieval';
  const isModernHistory = subjectKey === 'history' && subCategory === 'modern';
  const isPhysicalGeography = subjectKey === 'geography' && category === 'physical-geography';
  const isIndianGeography = subjectKey === 'geography' && category === 'indian-geography';
  const isWorldGeography = subjectKey === 'geography' && category === 'world-geography';
  const isEnvironmentEcology = subjectKey === 'geography' && category === 'environment-ecology';
  const isEconomicFundamentals = subjectKey === 'economics' && category === 'economic-fundamentals';
  const isNationalIncomeMacroeconomics =
    subjectKey === 'economics' && category === 'national-income-macroeconomics';
  const isMoneyBankingFinancialSystem =
    subjectKey === 'economics' && category === 'money-banking-financial-system';
  const isPublicFinance = subjectKey === 'economics' && category === 'public-finance';
  const isIndianEconomySectors = subjectKey === 'economics' && category === 'indian-economy-sectors';
  const isEconomicPlanningDevelopment =
    subjectKey === 'economics' && category === 'economic-planning-development';
  const isExternalSector = subjectKey === 'economics' && category === 'external-sector';
  const isInflationEmploymentPoverty =
    subjectKey === 'economics' && category === 'inflation-employment-poverty';
  const isInternationalEconomicOrganizations =
    subjectKey === 'economics' && category === 'international-economic-organizations';
  const isNumberSystem = subjectKey === 'math' && category === 'number-system';
  const isArithmetic = subjectKey === 'math' && category === 'arithmetic';
  const isAlgebra = subjectKey === 'math' && category === 'algebra';
  const isGeometryMensuration = subjectKey === 'math' && category === 'geometry-mensuration';
  const isTrigonometry = subjectKey === 'math' && category === 'trigonometry';
  const isDataInterpretation = subjectKey === 'math' && category === 'data-interpretation';
  const isStatisticsProbability = subjectKey === 'math' && category === 'statistics-probability';
  const isAdvancedMathematics = subjectKey === 'math' && category === 'advanced-mathematics';
  const isPhysics = subjectKey === 'science' && category === 'physics';
  const isChemistry = subjectKey === 'science' && category === 'chemistry';
  const isBiology = subjectKey === 'science' && category === 'biology';
  const isGeneralScience = subjectKey === 'science' && category === 'general-science';
  const isStructuredMath =
    isNumberSystem ||
    isArithmetic ||
    isAlgebra ||
    isGeometryMensuration ||
    isTrigonometry ||
    isDataInterpretation ||
    isStatisticsProbability ||
    isAdvancedMathematics;
  const isStructuredEconomics =
    isEconomicFundamentals ||
    isNationalIncomeMacroeconomics ||
    isMoneyBankingFinancialSystem ||
    isPublicFinance ||
    isIndianEconomySectors ||
    isEconomicPlanningDevelopment ||
    isExternalSector ||
    isInflationEmploymentPoverty ||
    isInternationalEconomicOrganizations;
  const pageHeading = isPhysicalGeography
    ? lang === 'hi'
      ? PHYSICAL_GEOGRAPHY_PAGE_TITLE.hi
      : PHYSICAL_GEOGRAPHY_PAGE_TITLE.en
    : isIndianGeography
    ? lang === 'hi'
      ? INDIAN_GEOGRAPHY_PAGE_TITLE.hi
      : INDIAN_GEOGRAPHY_PAGE_TITLE.en
    : isWorldGeography
    ? lang === 'hi'
      ? WORLD_GEOGRAPHY_PAGE_TITLE.hi
      : WORLD_GEOGRAPHY_PAGE_TITLE.en
    : isEnvironmentEcology
    ? lang === 'hi'
      ? ENVIRONMENT_ECOLOGY_PAGE_TITLE.hi
      : ENVIRONMENT_ECOLOGY_PAGE_TITLE.en
    : isEconomicFundamentals
    ? lang === 'hi'
      ? ECONOMIC_FUNDAMENTALS_PAGE_TITLE.hi
      : ECONOMIC_FUNDAMENTALS_PAGE_TITLE.en
    : isNationalIncomeMacroeconomics
    ? lang === 'hi'
      ? NATIONAL_INCOME_MACROECONOMICS_PAGE_TITLE.hi
      : NATIONAL_INCOME_MACROECONOMICS_PAGE_TITLE.en
    : isMoneyBankingFinancialSystem
    ? lang === 'hi'
      ? MONEY_BANKING_FINANCIAL_SYSTEM_PAGE_TITLE.hi
      : MONEY_BANKING_FINANCIAL_SYSTEM_PAGE_TITLE.en
    : isPublicFinance
    ? lang === 'hi'
      ? PUBLIC_FINANCE_PAGE_TITLE.hi
      : PUBLIC_FINANCE_PAGE_TITLE.en
    : isIndianEconomySectors
    ? lang === 'hi'
      ? INDIAN_ECONOMY_SECTORS_PAGE_TITLE.hi
      : INDIAN_ECONOMY_SECTORS_PAGE_TITLE.en
    : isEconomicPlanningDevelopment
    ? lang === 'hi'
      ? ECONOMIC_PLANNING_DEVELOPMENT_PAGE_TITLE.hi
      : ECONOMIC_PLANNING_DEVELOPMENT_PAGE_TITLE.en
    : isExternalSector
    ? lang === 'hi'
      ? EXTERNAL_SECTOR_PAGE_TITLE.hi
      : EXTERNAL_SECTOR_PAGE_TITLE.en
    : isInflationEmploymentPoverty
    ? lang === 'hi'
      ? INFLATION_EMPLOYMENT_POVERTY_PAGE_TITLE.hi
      : INFLATION_EMPLOYMENT_POVERTY_PAGE_TITLE.en
    : isInternationalEconomicOrganizations
    ? lang === 'hi'
      ? INTERNATIONAL_ECONOMIC_ORGANIZATIONS_PAGE_TITLE.hi
      : INTERNATIONAL_ECONOMIC_ORGANIZATIONS_PAGE_TITLE.en
    : isNumberSystem
    ? lang === 'hi'
      ? NUMBER_SYSTEM_PAGE_TITLE.hi
      : NUMBER_SYSTEM_PAGE_TITLE.en
    : isArithmetic
    ? lang === 'hi'
      ? ARITHMETIC_PAGE_TITLE.hi
      : ARITHMETIC_PAGE_TITLE.en
    : isAlgebra
    ? lang === 'hi'
      ? ALGEBRA_PAGE_TITLE.hi
      : ALGEBRA_PAGE_TITLE.en
    : isGeometryMensuration
    ? lang === 'hi'
      ? GEOMETRY_MENSURATION_PAGE_TITLE.hi
      : GEOMETRY_MENSURATION_PAGE_TITLE.en
    : isTrigonometry
    ? lang === 'hi'
      ? TRIGONOMETRY_PAGE_TITLE.hi
      : TRIGONOMETRY_PAGE_TITLE.en
    : isDataInterpretation
    ? lang === 'hi'
      ? DATA_INTERPRETATION_PAGE_TITLE.hi
      : DATA_INTERPRETATION_PAGE_TITLE.en
    : isStatisticsProbability
    ? lang === 'hi'
      ? STATISTICS_PROBABILITY_PAGE_TITLE.hi
      : STATISTICS_PROBABILITY_PAGE_TITLE.en
    : isAdvancedMathematics
    ? lang === 'hi'
      ? ADVANCED_MATHEMATICS_PAGE_TITLE.hi
      : ADVANCED_MATHEMATICS_PAGE_TITLE.en
    : isPhysics
    ? lang === 'hi'
      ? PHYSICS_PAGE_TITLE.hi
      : PHYSICS_PAGE_TITLE.en
    : isChemistry
    ? lang === 'hi'
      ? CHEMISTRY_PAGE_TITLE.hi
      : CHEMISTRY_PAGE_TITLE.en
    : isBiology
    ? lang === 'hi'
      ? BIOLOGY_PAGE_TITLE.hi
      : BIOLOGY_PAGE_TITLE.en
    : isGeneralScience
    ? lang === 'hi'
      ? GENERAL_SCIENCE_PAGE_TITLE.hi
      : GENERAL_SCIENCE_PAGE_TITLE.en
    : labels.pageTitle(subjectLabel);

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
  const modernHistoryCounts = useMemo(() => {
    const subtopicCounts = new Map<string, number>();
    const groupTotals = new Map<number, number>();
    const flatSubtopics: Array<{
      key: string;
      groupId: number;
      en: string;
      hi: string;
    }> = [];

    for (const topicGroup of modernHistoryData) {
      groupTotals.set(topicGroup.id, 0);
      topicGroup.subtopics.forEach((subtopic, index) => {
        const parsed = splitBilingualText(subtopic);
        const key = `${topicGroup.id}-${index}`;
        flatSubtopics.push({ key, groupId: topicGroup.id, en: parsed.en, hi: parsed.hi });
        subtopicCounts.set(key, 0);
      });
    }

    // Assign each DB topic count to at most one best-matching subtopic.
    for (const topic of topics) {
      const sourceTexts = [topic.en, topic.hi].filter(Boolean);
      if (!sourceTexts.length) continue;

      let bestKey = '';
      let bestGroupId = 0;
      let bestScore = 0;

      for (const subtopic of flatSubtopics) {
        const targetTexts = [subtopic.en, subtopic.hi].filter(Boolean);
        if (!targetTexts.length) continue;

        let score = 0;
        for (const source of sourceTexts) {
          const sourceNorm = normalizeText(source);
          for (const target of targetTexts) {
            const targetNorm = normalizeText(target);
            if (!sourceNorm || !targetNorm) continue;

            if (sourceNorm === targetNorm) {
              score = Math.max(score, 1);
              continue;
            }

            if (
              topicMatches(source, target) ||
              topicMatches(target, source) ||
              sourceNorm.includes(targetNorm) ||
              targetNorm.includes(sourceNorm)
            ) {
              score = Math.max(score, 0.75);
            }
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestKey = subtopic.key;
          bestGroupId = subtopic.groupId;
        }
      }

      if (bestKey) {
        const topicCount = Number(topic.count ?? 0);
        subtopicCounts.set(bestKey, (subtopicCounts.get(bestKey) ?? 0) + topicCount);
        groupTotals.set(bestGroupId, (groupTotals.get(bestGroupId) ?? 0) + topicCount);
      }
    }

    const grandTotal = topics.reduce((sum, topic) => sum + Number(topic.count ?? 0), 0);
    return { subtopicCounts, groupTotals, grandTotal };
  }, [modernHistoryData, topics]);

  const modernHistoryTotalQuestions = modernHistoryCounts.grandTotal;
  const totalQuestionsDisplay = isModernHistory
    ? modernHistoryTotalQuestions
    : topics.reduce((sum, topic) => sum + Number(topic.count ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 pt-6 pb-8 items-start">
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
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">
                      {(isModernHistory || isPhysicalGeography || isIndianGeography || isWorldGeography || isEnvironmentEcology || isStructuredEconomics || isStructuredMath || isPhysics || isChemistry || isBiology || isGeneralScience ? totalQuestionsDisplay : topics.reduce((s, t) => s + (t.count ?? 0), 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 col-span-1 w-full min-h-screen pb-20">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pageHeading}
            </h1>
            <p className="mt-3 text-sm text-slate-500 max-w-2xl leading-7">
              {isEconomicFundamentals
                ? lang === 'hi'
                  ? ECONOMIC_FUNDAMENTALS_SCOPE.hi
                  : ECONOMIC_FUNDAMENTALS_SCOPE.en
                : isNationalIncomeMacroeconomics
                ? lang === 'hi'
                  ? NATIONAL_INCOME_MACROECONOMICS_SCOPE.hi
                  : NATIONAL_INCOME_MACROECONOMICS_SCOPE.en
                : isMoneyBankingFinancialSystem
                ? lang === 'hi'
                  ? MONEY_BANKING_FINANCIAL_SYSTEM_SCOPE.hi
                  : MONEY_BANKING_FINANCIAL_SYSTEM_SCOPE.en
                : isPublicFinance
                ? lang === 'hi'
                  ? PUBLIC_FINANCE_SCOPE.hi
                  : PUBLIC_FINANCE_SCOPE.en
                : isIndianEconomySectors
                ? lang === 'hi'
                  ? INDIAN_ECONOMY_SECTORS_SCOPE.hi
                  : INDIAN_ECONOMY_SECTORS_SCOPE.en
                : isEconomicPlanningDevelopment
                ? lang === 'hi'
                  ? ECONOMIC_PLANNING_DEVELOPMENT_SCOPE.hi
                  : ECONOMIC_PLANNING_DEVELOPMENT_SCOPE.en
                : isExternalSector
                ? lang === 'hi'
                  ? EXTERNAL_SECTOR_SCOPE.hi
                  : EXTERNAL_SECTOR_SCOPE.en
                : isInflationEmploymentPoverty
                ? lang === 'hi'
                  ? INFLATION_EMPLOYMENT_POVERTY_SCOPE.hi
                  : INFLATION_EMPLOYMENT_POVERTY_SCOPE.en
                : isInternationalEconomicOrganizations
                ? lang === 'hi'
                  ? INTERNATIONAL_ECONOMIC_ORGANIZATIONS_SCOPE.hi
                  : INTERNATIONAL_ECONOMIC_ORGANIZATIONS_SCOPE.en
                : isNumberSystem
                ? lang === 'hi'
                  ? NUMBER_SYSTEM_SCOPE.hi
                  : NUMBER_SYSTEM_SCOPE.en
                : isArithmetic
                ? lang === 'hi'
                  ? ARITHMETIC_SCOPE.hi
                  : ARITHMETIC_SCOPE.en
                : isAlgebra
                ? lang === 'hi'
                  ? ALGEBRA_SCOPE.hi
                  : ALGEBRA_SCOPE.en
                : isGeometryMensuration
                ? lang === 'hi'
                  ? GEOMETRY_MENSURATION_SCOPE.hi
                  : GEOMETRY_MENSURATION_SCOPE.en
                : isTrigonometry
                ? lang === 'hi'
                  ? TRIGONOMETRY_SCOPE.hi
                  : TRIGONOMETRY_SCOPE.en
                : isDataInterpretation
                ? lang === 'hi'
                  ? DATA_INTERPRETATION_SCOPE.hi
                  : DATA_INTERPRETATION_SCOPE.en
                : isStatisticsProbability
                ? lang === 'hi'
                  ? STATISTICS_PROBABILITY_SCOPE.hi
                  : STATISTICS_PROBABILITY_SCOPE.en
                : isAdvancedMathematics
                ? lang === 'hi'
                  ? ADVANCED_MATHEMATICS_SCOPE.hi
                  : ADVANCED_MATHEMATICS_SCOPE.en
                : isPhysics
                ? lang === 'hi'
                  ? PHYSICS_SCOPE.hi
                  : PHYSICS_SCOPE.en
                : isChemistry
                ? lang === 'hi'
                  ? CHEMISTRY_SCOPE.hi
                  : CHEMISTRY_SCOPE.en
                : isBiology
                ? lang === 'hi'
                  ? BIOLOGY_SCOPE.hi
                  : BIOLOGY_SCOPE.en
                : isGeneralScience
                ? lang === 'hi'
                  ? GENERAL_SCIENCE_SCOPE.hi
                  : GENERAL_SCIENCE_SCOPE.en
                : labels.topicSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            {isGeneralScience && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={GENERAL_SCIENCE_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={GENERAL_SCIENCE_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isBiology && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={BIOLOGY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={BIOLOGY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isChemistry && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={CHEMISTRY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={CHEMISTRY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isPhysics && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={PHYSICS_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={PHYSICS_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isAdvancedMathematics && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={ADVANCED_MATHEMATICS_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={ADVANCED_MATHEMATICS_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isStatisticsProbability && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={STATISTICS_PROBABILITY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={STATISTICS_PROBABILITY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isDataInterpretation && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={DATA_INTERPRETATION_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={DATA_INTERPRETATION_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isTrigonometry && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={TRIGONOMETRY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={TRIGONOMETRY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isGeometryMensuration && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={GEOMETRY_MENSURATION_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={GEOMETRY_MENSURATION_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isAlgebra && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={ALGEBRA_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={ALGEBRA_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isArithmetic && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={ARITHMETIC_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={ARITHMETIC_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isNumberSystem && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={NUMBER_SYSTEM_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={NUMBER_SYSTEM_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isInternationalEconomicOrganizations && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={INTERNATIONAL_ECONOMIC_ORGANIZATIONS_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={INTERNATIONAL_ECONOMIC_ORGANIZATIONS_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isInflationEmploymentPoverty && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={INFLATION_EMPLOYMENT_POVERTY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={INFLATION_EMPLOYMENT_POVERTY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isExternalSector && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={EXTERNAL_SECTOR_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={EXTERNAL_SECTOR_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isEconomicPlanningDevelopment && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={ECONOMIC_PLANNING_DEVELOPMENT_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={ECONOMIC_PLANNING_DEVELOPMENT_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isIndianEconomySectors && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={INDIAN_ECONOMY_SECTORS_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={INDIAN_ECONOMY_SECTORS_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isPublicFinance && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={PUBLIC_FINANCE_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={PUBLIC_FINANCE_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isMoneyBankingFinancialSystem && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={MONEY_BANKING_FINANCIAL_SYSTEM_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={MONEY_BANKING_FINANCIAL_SYSTEM_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isNationalIncomeMacroeconomics && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={NATIONAL_INCOME_MACROECONOMICS_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={NATIONAL_INCOME_MACROECONOMICS_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isEconomicFundamentals && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={ECONOMIC_FUNDAMENTALS_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={ECONOMIC_FUNDAMENTALS_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isEnvironmentEcology && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={ENVIRONMENT_ECOLOGY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={ENVIRONMENT_ECOLOGY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isIndianGeography && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={INDIAN_GEOGRAPHY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={INDIAN_GEOGRAPHY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isWorldGeography && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={WORLD_GEOGRAPHY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={WORLD_GEOGRAPHY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isPhysicalGeography && (
              <StructuredTopicGroups
                subjectKey={subjectKey}
                topicGroups={PHYSICAL_GEOGRAPHY_DATA}
                topics={topics}
                lang={lang}
                sectionLabel={PHYSICAL_GEOGRAPHY_SECTION_LABEL}
                questionsAvailableLabel={labels.questionsAvailable}
                defaultOpenId={1}
              />
            )}

            {isModernHistory && (
              <div className="space-y-4">
                {modernHistoryData.map((topicGroup) => {
                  const isOpen = openModernCardId === topicGroup.id;
                  const parsedTitle = splitBilingualText(topicGroup.title);
                  const displayTitle = lang === 'hi' ? parsedTitle.hi : parsedTitle.en;
                  return (
                    <div
                      key={topicGroup.id}
                      className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenModernCardId((prev) => (prev === topicGroup.id ? null : topicGroup.id))}
                        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">
                            {lang === 'hi' ? 'आधुनिक भारत के विषय' : 'Modern India Topics'}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">{displayTitle}</h3>
                          <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-6">
                            {lang === 'hi'
                              ? 'उपविषयों को खोलने और प्रश्न संख्या देखने के लिए क्लिक करें।'
                              : 'Click to open the subtopics and review question counts.'}
                          </p>
                          <p className="mt-3 text-sm text-slate-500">
                            {lang === 'hi'
                              ? `${topicGroup.subtopics.length} विषय · ${(modernHistoryCounts.groupTotals.get(topicGroup.id) ?? 0).toLocaleString()} कुल प्रश्न`
                              : `${topicGroup.subtopics.length} topics · ${(modernHistoryCounts.groupTotals.get(topicGroup.id) ?? 0).toLocaleString()} questions total`}
                          </p>
                        </div>
                        <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 shrink-0">
                          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </span>
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="space-y-3 px-6 pb-5">
                            {topicGroup.subtopics.map((subtopic, index) => {
                              const parsedSubtopic = splitBilingualText(subtopic);
                              const displaySubtopic = lang === 'hi' ? parsedSubtopic.hi : parsedSubtopic.en;
                              const realCount = modernHistoryCounts.subtopicCounts.get(`${topicGroup.id}-${index}`) ?? 0;
                              const topicHref = `/${subjectKey}/topics/${slugifySubject(parsedSubtopic.en || displaySubtopic)}`;
                              return (
                                <Link
                                  key={`${topicGroup.id}-${index}`}
                                  href={topicHref}
                                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {lang === 'hi' ? `विषय ${index + 1}: ${displaySubtopic}` : `Topic ${index + 1}: ${displaySubtopic}`}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">{`${realCount.toLocaleString()} ${labels.questionsAvailable}`}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
                              <p className="mt-1 text-xs text-slate-500">{getTopicCountText(item.count, labels)}</p>
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
                              <p className="mt-1 text-xs text-slate-500">{getTopicCountText(item.count, labels)}</p>
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
                              <p className="mt-1 text-xs text-slate-500">{getTopicCountText(item.count, labels)}</p>
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
                              <p className="mt-1 text-xs text-slate-500">{getTopicCountText(item.count, labels)}</p>
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
                              <p className="mt-1 text-xs text-slate-500">{getTopicCountText(item.count, labels)}</p>
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
                              <p className="mt-1 text-xs text-slate-500">{getTopicCountText(item.count, labels)}</p>
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

            {!isModernHistory && !isPhysicalGeography && !isIndianGeography && !isWorldGeography && !isEnvironmentEcology && !isStructuredEconomics && !isStructuredMath && !isPhysics && !isChemistry && !isBiology && !isGeneralScience && topics.map((topic, index) => {
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
      </div>
    </div>
  );
}
