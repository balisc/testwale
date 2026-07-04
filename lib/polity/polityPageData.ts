import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Building2,
  CheckSquare,
  Feather,
  FileText,
  Gavel,
  Handshake,
  Landmark,
  MapPin,
  Scale,
  Settings,
} from 'lucide-react';

export type PolityTopicMeta = {
  id: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  examTagEn: string;
  examTagHi: string;
  icon: LucideIcon;
  matchKeywords: string[];
};

export const POLITY_EXAM_FILTERS = [
  { id: 'all', en: 'All Exams', hi: 'सभी परीक्षाएँ' },
  { id: 'upsc', en: 'UPSC', hi: 'UPSC' },
  { id: 'ssc', en: 'SSC', hi: 'SSC' },
  { id: 'railway', en: 'Railway', hi: 'Railway' },
  { id: 'state-pcs', en: 'State PCS', hi: 'State PCS' },
] as const;

export type PolityExamFilterId = (typeof POLITY_EXAM_FILTERS)[number]['id'];

export const POLITY_TOPIC_META: PolityTopicMeta[] = [
  {
    id: 'constitutional-history',
    titleEn: 'Constitutional History',
    titleHi: 'संवैधानिक इतिहास',
    descriptionEn: 'Making of the Constitution, Constituent Assembly, sources and key debates.',
    descriptionHi: 'संविधान निर्माण, संविधान सभा, स्रोत और प्रमुख बहस।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Feather,
    matchKeywords: ['constitutional history', 'constitution making', 'constituent assembly'],
  },
  {
    id: 'fundamental-rights',
    titleEn: 'Fundamental Rights, DPSP & Duties',
    titleHi: 'मौलिक अधिकार, DPSP और कर्तव्य',
    descriptionEn: 'Rights, Directive Principles, Fundamental Duties and related amendments.',
    descriptionHi: 'अधिकार, नीति निर्देशक सिद्धांत, मौलिक कर्तव्य और संशोधन।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Scale,
    matchKeywords: ['fundamental rights', 'dpsp', 'duties', 'directive principles'],
  },
  {
    id: 'union-executive',
    titleEn: 'Union Executive',
    titleHi: 'केंद्रीय कार्यपालिका',
    descriptionEn: 'President, Vice-President, PM, Council of Ministers and powers.',
    descriptionHi: 'राष्ट्रपति, उपराष्ट्रपति, PM, मंत्रिपरिषद और शक्तियाँ।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Building2,
    matchKeywords: ['union executive', 'president', 'prime minister', 'council of ministers'],
  },
  {
    id: 'state-executive',
    titleEn: 'State Executive',
    titleHi: 'राज्य कार्यपालिका',
    descriptionEn: 'Governor, CM, state council and executive powers.',
    descriptionHi: 'राज्यपाल, CM, राज्य मंत्रिपरिषद और कार्यपालिका शक्तियाँ।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Landmark,
    matchKeywords: ['state executive', 'governor', 'chief minister'],
  },
  {
    id: 'parliament',
    titleEn: 'Parliament & Legislative Process',
    titleHi: 'संसद और विधायी प्रक्रिया',
    descriptionEn: 'Lok Sabha, Rajya Sabha, law-making, committees and sessions.',
    descriptionHi: 'लोकसभा, राज्यसभा, कानून निर्माण, समितियाँ और सत्र।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Landmark,
    matchKeywords: ['parliament', 'legislative', 'lok sabha', 'rajya sabha'],
  },
  {
    id: 'judiciary',
    titleEn: 'Judiciary, RTI & Tribunals',
    titleHi: 'न्यायपालिका, RTI और अधिकरण',
    descriptionEn: 'Supreme Court, High Courts, judicial review, RTI Act and tribunals.',
    descriptionHi: 'सर्वोच्च न्यायालय, उच्च न्यायालय, न्यायिक समीक्षा, RTI और अधिकरण।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Gavel,
    matchKeywords: ['judiciary', 'rti', 'tribunal', 'supreme court', 'high court'],
  },
  {
    id: 'local-government',
    titleEn: 'Local Government',
    titleHi: 'स्थानीय शासन',
    descriptionEn: 'Panchayati Raj, municipalities, 73rd & 74th Amendments.',
    descriptionHi: 'पंचायती राज, नगरपालिका, 73वें और 74वें संशोधन।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: MapPin,
    matchKeywords: ['local government', 'panchayati', 'municipal', 'urban local'],
  },
  {
    id: 'constitutional-bodies',
    titleEn: 'Constitutional & Statutory Bodies',
    titleHi: 'संवैधानिक और वैधानिक निकाय',
    descriptionEn: 'CAG, EC, UPSC, Finance Commission and other key institutions.',
    descriptionHi: 'CAG, EC, UPSC, वित्त आयोग और अन्य प्रमुख संस्थाएँ।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: Settings,
    matchKeywords: ['constitutional bodies', 'statutory', 'cag', 'election commission', 'upsc'],
  },
  {
    id: 'elections',
    titleEn: 'Elections & Representation',
    titleHi: 'चुनाव और प्रतिनिधित्व',
    descriptionEn: 'Election system, delimitation, anti-defection and representation.',
    descriptionHi: 'चुनाव प्रणाली, परिसीमन, दल-बदल विरोधी कानून और प्रतिनिधित्व।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: CheckSquare,
    matchKeywords: ['election', 'representation', 'anti-defection', 'delimitation'],
  },
  {
    id: 'emergency',
    titleEn: 'Emergency Provisions',
    titleHi: 'आपातकालीन प्रावधान',
    descriptionEn: 'National, state and financial emergency — grounds and effects.',
    descriptionHi: 'राष्ट्रीय, राज्य और वित्तीय आपातकाल — आधार और प्रभाव।',
    examTagEn: 'All Exams',
    examTagHi: 'All Exams',
    icon: AlertTriangle,
    matchKeywords: ['emergency'],
  },
  {
    id: 'centre-state',
    titleEn: 'Centre–State Relations',
    titleHi: 'केंद्र–राज्य संबंध',
    descriptionEn: 'Legislative, administrative and financial relations; inter-state issues.',
    descriptionHi: 'विधायी, प्रशासनिक और वित्तीय संबंध; अंतर-राज्य मुद्दे।',
    examTagEn: 'UPSC + SSC + PCS',
    examTagHi: 'UPSC + SSC + PCS',
    icon: Handshake,
    matchKeywords: ['centre-state', 'center-state', 'center state', 'federal', 'inter-state'],
  },
  {
    id: 'amendments',
    titleEn: 'Amendments & Schedules',
    titleHi: 'संशोधन और अनुसूचियाँ',
    descriptionEn: 'Major amendments, schedules of the Constitution and recent changes.',
    descriptionHi: 'प्रमुख संशोधन, संविधान की अनुसूचियाँ और हाल के परिवर्तन।',
    examTagEn: 'State Module',
    examTagHi: 'State Module',
    icon: FileText,
    matchKeywords: ['amendment', 'schedules', 'schedule'],
  },
];

export function normalizeTopicKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function matchPolityMeta(topicEn: string, topicHi: string): PolityTopicMeta | undefined {
  const combined = normalizeTopicKey(`${topicEn} ${topicHi}`);
  return POLITY_TOPIC_META.find((meta) =>
    meta.matchKeywords.some((kw) => combined.includes(normalizeTopicKey(kw))),
  );
}
