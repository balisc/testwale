/**
 * Rich bilingual content — Company Rule and Early Acts
 * Version: indian-polity/constitutional-history-making/company-rule-early-acts.v2
 */

export const COMPANY_RULE_REVISION_VERSION =
  'indian-polity/constitutional-history-making/company-rule-early-acts.v2';

/** Major learning units for in-section progress pills (includes topic overview as unit 1). */
export const COMPANY_RULE_LEARNING_UNITS = [
  'topic-overview',
  'charter-need',
  'charter-meaning',
  'company-entry-in-bengal',
  'trade-misuse',
  'battle-of-plassey',
  'dual-government',
] as const;

export function getLearningUnitProgress(sectionId: string) {
  const index = COMPANY_RULE_LEARNING_UNITS.indexOf(sectionId as (typeof COMPANY_RULE_LEARNING_UNITS)[number]);
  if (index === -1) return null;
  return { current: index + 1, total: COMPANY_RULE_LEARNING_UNITS.length };
}

/** Seven parliamentary Acts covered in the hero timeline and progress card. */
export const COMPANY_RULE_ACT_CHAPTERS = [
  { id: 'regulating-act-1773', year: '1773', name: { en: 'Regulating Act', hi: 'Regulating Act' } },
  { id: 'act-of-settlement-1781', year: '1781', name: { en: 'Act of Settlement', hi: 'Act of Settlement' } },
  { id: 'pitts-india-act-1784', year: '1784', name: { en: "Pitt's India Act", hi: "Pitt's India Act" } },
  { id: 'charter-act-1793', year: '1793', name: { en: 'Charter Act', hi: 'Charter Act' } },
  { id: 'charter-act-1813', year: '1813', name: { en: 'Charter Act', hi: 'Charter Act' } },
  { id: 'charter-act-1833', year: '1833', name: { en: 'Charter Act', hi: 'Charter Act' } },
  { id: 'charter-act-1853', year: '1853', name: { en: 'Charter Act', hi: 'Charter Act' } },
] as const;

export const COMPANY_RULE_ACT_CHAPTER_TOTAL = COMPANY_RULE_ACT_CHAPTERS.length;

export type BiString = { en: string; hi: string };

export type BengalTimelineStep = {
  accent: 'purple' | 'green' | 'blue' | 'orange';
  year?: string;
  text?: BiString;
  title?: BiString;
  sub?: BiString;
};

export type RevisionSectionMeta = {
  id: string;
  number: string;
  label: BiString;
  title: BiString;
  description: BiString;
  sourceId?: string;
  navLabel: BiString;
};

/** Primary section registry — drives roadmap, sticky nav, and anchors. */
export const revisionSections: RevisionSectionMeta[] = [
  {
    id: 'charter-need',
    number: '01',
    label: { en: '01 • Background', hi: '01 • पृष्ठभूमि' },
    title: { en: 'Why was Charter 1600 needed?', hi: 'Charter 1600 क्यों लाना पड़ा?' },
    description: {
      en: 'By the late 16th century, demand for Indian goods in Europe had grown sharply. Spices, cloth, fibre, indigo, sugar and precious goods were very popular. English traders were trading in India but lacked legal recognition and security. So the British government decided to grant a Charter to one authorised company.',
      hi: '16वीं सदी के अंत तक यूरोप में भारतीय वस्तुओं की मांग बहुत बढ़ गई थी। मसाले, कपड़े, रेशा, नील, शक्कर और कीमती वस्तुएं यहाँ बहुत लोकप्रिय थीं। अंग्रेज व्यापारी भारत में व्यापार कर रहे थे, लेकिन उन्हें कानूनी मान्यता और सुरक्षा नहीं मिल रही थी। इसीलिए ब्रिटिश सरकार ने एक अधिकृत कंपनी को Charter देने का फैसला किया।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Charter need', hi: 'Charter की जरूरत' },
  },
  {
    id: 'charter-meaning',
    number: '02',
    label: { en: '02 • Royal Charter', hi: '02 • Royal Charter' },
    title: { en: 'What was the Charter of 1600?', hi: '1600 का Charter क्या था?' },
    description: {
      en: 'On 31 December 1600, Queen Elizabeth I granted a royal charter to the Governor and Company of Merchants of London trading into the East Indies, establishing the East India Company.',
      hi: '31 दिसंबर, 1600 को Queen Elizabeth I ने \'Governor and Company of Merchants of London trading into the East Indies\' को एक royal charter दिया, जिससे East India Company की स्थापना हुई।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Charter 1600', hi: 'Charter 1600' },
  },
  {
    id: 'company-entry-in-bengal',
    number: '03',
    label: { en: '03 • Early Settlements', hi: '03 • Early Settlements' },
    title: { en: 'How did the Company begin in Bengal?', hi: 'Bengal में Company की शुरुआत कैसे हुई?' },
    description: {
      en: 'The East India Company did not start in Bengal with rule — it began with trading posts that slowly became warehouses, settlements and fortified centres.',
      hi: 'ईस्ट इंडिया कंपनी ने बंगाल में शुरुआत शासन से नहीं, व्यापारिक ठिकानों से की थी। ये ठिकाने धीरे-धीरे warehouses, settlements और fortified centres में बदलते गए।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Bengal Entry', hi: 'Bengal Entry' },
  },
  {
    id: 'trade-misuse',
    number: '04',
    label: { en: '04 • Trade Privilege', hi: '04 • Trade Privilege' },
    title: { en: 'Misuse of duty-free trade', hi: 'Trade privileges और उनका misuse' },
    description: {
      en: 'Official Company trade enjoyed duty-free privileges. Many officials used this exemption for private trade too, harming Bengal\'s customs revenue.',
      hi: 'Company के official trade को मिली शुल्क-छूट का उपयोग उसके कई अधिकारियों ने private trade में भी किया। निजी व्यापार पर देय शुल्क न देने से Bengal administration को revenue loss हुआ और Nawab की authority कमजोर हुई।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Trade Misuse', hi: 'Trade Misuse' },
  },
  {
    id: 'company-nawab-conflict',
    number: '05',
    label: { en: '05 • Conflict with Nawabs', hi: '05 • Conflict with Nawabs' },
    title: { en: 'Why did conflict with Bengal Nawabs grow?', hi: 'Company और Bengal के Nawabs में टकराव क्यों बढ़ा?' },
    description: {
      en: 'The Company wanted not only trade facilities but also fortification, revenue concessions and political influence — which Bengal Nawabs saw as a challenge to their authority.',
      hi: 'Company केवल व्यापारिक सुविधा नहीं चाहती थी। वह fortification, revenue concessions और political influence भी बढ़ा रही थी। Bengal के Nawabs इसे अपनी सत्ता और आय के लिए चुनौती मानते थे।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Nawab conflict', hi: 'Nawab conflict' },
  },
  {
    id: 'battle-of-plassey',
    number: '06',
    label: { en: '06 • Plassey 1757', hi: '06 • Plassey 1757' },
    title: { en: 'How did the Battle of Plassey change the Company\'s position?', hi: 'Battle of Plassey ने Company की स्थिति कैसे बदली?' },
    description: {
      en: 'Plassey was not just a battle. After it, the Company became the decisive force in Bengal politics.',
      hi: 'Plassey केवल एक battle नहीं थी। इसके बाद Company Bengal की politics में निर्णायक शक्ति बन गई।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Plassey', hi: 'Plassey' },
  },
  {
    id: 'mir-jafar-mir-qasim',
    number: '07',
    label: { en: '07 • Nawab Succession', hi: '07 • Nawab Succession' },
    title: { en: 'What happened from Mir Jafar to Mir Qasim?', hi: 'Mir Jafar से Mir Qasim तक क्या हुआ?' },
    description: {
      en: 'After Plassey, Mir Jafar became Nawab but struggled with Company demands. Mir Qasim tried to strengthen administration — leading to renewed conflict.',
      hi: 'Plassey के बाद Mir Jafar को Nawab बनाया गया, लेकिन Company की financial demands पूरी करना उसके लिए कठिन हो गया। Company ने बाद में Mir Qasim को Nawab बनाया। Mir Qasim ने प्रशासन और राजस्व को मजबूत करने का प्रयास किया, जिससे Company से उसका conflict बढ़ गया।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Mir Jafar–Qasim', hi: 'Mir Jafar–Qasim' },
  },
  {
    id: 'battle-of-buxar',
    number: '08',
    label: { en: '08 • Buxar 1764', hi: '08 • Buxar 1764' },
    title: { en: 'Why was the Battle of Buxar important?', hi: 'Battle of Buxar क्यों महत्वपूर्ण थी?' },
    description: {
      en: 'Plassey gave the Company influence in Bengal politics; Buxar strengthened its military and political position further.',
      hi: 'Plassey ने Company को Bengal की politics में प्रभाव दिया, जबकि Buxar ने उसकी military और political position को अधिक मजबूत कर दिया।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Buxar', hi: 'Buxar' },
  },
  {
    id: 'treaty-allahabad-diwani',
    number: '09',
    label: { en: '09 • Settlement of 1765', hi: '09 • Settlement of 1765' },
    title: { en: 'Treaty of Allahabad and Diwani Settlement', hi: 'Treaty of Allahabad और Diwani Settlement' },
    description: {
      en: 'The post-Buxar settlement gave the Company not only military advantage but also a formal place in revenue and territorial politics.',
      hi: 'Buxar के बाद हुए settlement ने Company को केवल military advantage नहीं दिया, बल्कि revenue और territorial politics में औपचारिक स्थान भी दिया।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Allahabad', hi: 'Allahabad' },
  },
  {
    id: 'political-power',
    number: '10',
    label: { en: '10 • Political Transformation', hi: '10 • Political Transformation' },
    title: { en: 'From Trade to Political Power', hi: 'Trade से Political Power तक' },
    description: {
      en: 'A chronological view of how a trading company became a territorial power through settlements, battles and revenue control.',
      hi: 'एक trading company settlements, battles और revenue control के माध्यम से territorial power कैसे बनी — chronological view।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Political power', hi: 'Political power' },
  },
  {
    id: 'diwani',
    number: '11',
    label: { en: '11 • Revenue Administration', hi: '11 • Revenue Administration' },
    title: { en: 'What was Diwani?', hi: 'Diwani क्या थी?' },
    description: {
      en: 'In the 1765 settlement the Company received Diwani of Bengal, Bihar and Orissa — revenue administration and civil justice, not criminal justice.',
      hi: '1765 के settlement में Company को Bengal, Bihar और Orissa की Diwani मिली। इसका अर्थ revenue administration तथा civil justice से संबंधित अधिकार था।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Diwani', hi: 'Diwani' },
  },
  {
    id: 'diwani-nizamat',
    number: '12',
    label: { en: '12 • Administrative Difference', hi: '12 • Administrative Difference' },
    title: { en: 'Diwani vs Nizamat', hi: 'Diwani vs Nizamat' },
    description: {
      en: 'The difference in simple language — money and revenue versus law and order.',
      hi: 'दोनों का अंतर आसान भाषा में — धन/राजस्व बनाम कानून और व्यवस्था।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Diwani vs Nizamat', hi: 'Diwani vs Nizamat' },
  },
  {
    id: 'dual-government',
    number: '13',
    label: { en: '13 • Dual Government', hi: '13 • Dual Government' },
    title: { en: 'Dual Government', hi: 'Dual Government' },
    description: {
      en: 'Power separate, responsibility separate — not two equal governments.',
      hi: 'Power अलग, Responsibility अलग — दो बराबर governments नहीं।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Dual Government', hi: 'Dual Government' },
  },
  {
    id: 'muhammad-raza-khan',
    number: '14',
    label: { en: '14 • Indirect Administration', hi: '14 • Indirect Administration' },
    title: { en: 'Role of Muhammad Raza Khan', hi: 'Muhammad Raza Khan की भूमिका' },
    description: {
      en: 'Muhammad Raza Khan held Naib Diwan and Naib Nazim roles under Company supervision — a key link in indirect administration.',
      hi: 'Muhammad Raza Khan ने Naib Diwan और Naib Nazim की भूमिकाओं के माध्यम से indirect administration में महत्वपूर्ण स्थान प्राप्त किया। वह Company के supervision में कार्य करता था।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'M. Raza Khan', hi: 'M. Raza Khan' },
  },
  {
    id: 'constitutional-problem',
    number: '15',
    label: { en: '15 • Constitutional Issue', hi: '15 • Constitutional Issue' },
    title: { en: 'Why did Company Rule become a Constitutional Problem?', hi: 'Company Rule Constitutional Problem क्यों बना?' },
    description: {
      en: 'A private commercial company was exercising revenue, military and governmental powers without adequate public control.',
      hi: 'एक private commercial company अब revenue, military और governmental powers का प्रयोग कर रही थी, लेकिन उस पर पर्याप्त सार्वजनिक नियंत्रण और जवाबदेही नहीं थी।',
    },
    sourceId: 'nios-british-rule-establishment',
    navLabel: { en: 'Constitutional', hi: 'Constitutional' },
  },
  {
    id: 'complete-timeline',
    number: '16',
    label: { en: '16 • Complete Timeline', hi: '16 • Complete Timeline' },
    title: { en: 'Complete flow from 1600 to 1765', hi: '1600 से 1765 तक पूरा Flow' },
    description: {
      en: 'Trade began the journey; settlements, political interference, military victories and revenue control followed.',
      hi: 'Trade से शुरू हुई Company ने settlements, political interference, military victories और revenue control के माध्यम से territorial power प्राप्त की।',
    },
    sourceId: 'ncert-class8-trade-territory',
    navLabel: { en: 'Timeline', hi: 'Timeline' },
  },
  {
    id: 'exam-traps',
    number: '17',
    label: { en: '17 • Exam Traps', hi: '17 • Exam Traps' },
    title: { en: 'Common Exam Traps', hi: 'Common Exam Traps' },
    description: {
      en: 'Students get confused here most often in exams — spot the wrong line, remember the correct concept.',
      hi: 'Exam में student सबसे ज्यादा यहीं confuse होते हैं — गलत line पहचानो, सही concept याद रखो।',
    },
    navLabel: { en: 'Exam Traps', hi: 'Exam Traps' },
  },
  {
    id: 'mindmap',
    number: '18',
    label: { en: '18 • Quick Revision', hi: '18 • Quick Revision' },
    title: { en: 'Mind Map / Quick Revision Map', hi: 'Mind Map / Quick Revision Map' },
    description: {
      en: 'Complete coverage map for quick revision before exams.',
      hi: 'Exam से पहले quick revision के लिए complete coverage map।',
    },
    navLabel: { en: 'Mind Map', hi: 'Mind Map' },
  },
  {
    id: 'practice',
    number: '19',
    label: { en: '19 • Quick Practice', hi: '19 • Quick Practice' },
    title: { en: 'Check yourself now', hi: 'Quick Practice' },
    description: {
      en: 'Test both direct SSC facts and conceptual UPSC/PCS understanding.',
      hi: 'Direct SSC facts और conceptual UPSC/PCS understanding दोनों test करें।',
    },
    navLabel: { en: 'Practice', hi: 'Practice' },
  },
];

export const companyRuleRevisionContent = {
  version: COMPANY_RULE_REVISION_VERSION,
  estimatedMinutes: { min: 18, max: 25 },

  hero: {
    eyebrow: { en: 'INDIAN POLITY • CONSTITUTIONAL HISTORY', hi: 'भारतीय राजव्यवस्था • संवैधानिक इतिहास' },
    title: { en: 'Company Rule Acts, 1773–1853', hi: 'कंपनी शासन के अधिनियम, 1773–1853' },
    subtitle: {
      en: 'From a trading company to a government controlled by Parliament',
      hi: 'एक व्यापारिक कंपनी से संसद-नियंत्रित शासन तक',
    },
    description: {
      en: 'Seven landmark Acts transformed the East India Company from a commercial enterprise into an instrument of British rule under Parliamentary control. Understand the chronology, provisions, offices, councils and changes introduced by each Act.',
      hi: 'सात प्रमुख अधिनियमों ने ईस्ट इंडिया कंपनी को एक व्यापारिक संस्था से संसदीय नियंत्रण के अधीन ब्रिटिश शासन के साधन में बदल दिया। प्रत्येक अधिनियम की समयरेखा, प्रावधान, पद, परिषदें और उससे हुए परिवर्तनों को समझें।',
    },
    chips: [
      { icon: 'calendar' as const, label: { en: '1773–1853', hi: '1773–1853' }, tone: 'purple' as const },
      { icon: 'acts' as const, label: { en: '7 Core Acts', hi: '7 प्रमुख अधिनियम' }, tone: 'green' as const },
      { icon: 'compare' as const, label: { en: 'Chronology + Comparison', hi: 'कालक्रम + तुलना' }, tone: 'orange' as const },
      { icon: 'exams' as const, label: { en: 'SSC • Railway • UPSC • State PCS', hi: 'SSC • Railway • UPSC • State PCS' }, tone: 'blue' as const },
    ],
    ctaPrimary: { en: 'Start Revision', hi: 'रिवीजन शुरू करें' },
    ctaSecondary: { en: 'View Timeline', hi: 'समयरेखा देखें' },
    progressGuest: { en: 'Start your revision journey', hi: 'अपनी रिवीजन यात्रा शुरू करें' },
    hierarchy: {
      banner: {
        en: 'Gradual transfer and centralisation of control',
        hi: 'नियंत्रण का क्रमिक हस्तांतरण और केंद्रीकरण',
      },
      nodes: [
        {
          id: 'parliament',
          label: { en: 'British Parliament', hi: 'ब्रिटिश संसद' },
          caption: { en: 'Ultimate authority rests with Parliament.', hi: 'अंतिम अधिकार संसद के पास होता है।' },
        },
        {
          id: 'east-india-house',
          label: { en: 'East India House', hi: 'ईस्ट इंडिया हाउस' },
          caption: { en: 'Company supervised by Board of Control.', hi: 'नियंत्रण बोर्ड द्वारा कंपनी की देखरेख।' },
        },
        {
          id: 'court-of-directors',
          label: { en: 'Court of Directors', hi: 'निदेशक मंडल' },
          caption: { en: "Company's administrative and commercial body.", hi: 'कंपनी की प्रशासनिक और वाणिज्यिक संस्था।' },
        },
        {
          id: 'fort-william',
          label: { en: 'Fort William', hi: 'फोर्ट विलियम' },
          caption: { en: 'Governor-General and his Council.', hi: 'गवर्नर-जनरल और उनकी परिषद।' },
        },
      ],
    },
  },

  storyTimelineSection: {
    sectionNumber: '02',
    eyebrow: { en: 'THE COMPLETE STORY • 1773–1853', hi: 'पूरी कहानी • 1773–1853' },
    title: {
      en: 'How Company rule changed in seven landmark Acts',
      hi: 'सात प्रमुख अधिनियमों ने कंपनी शासन को कैसे बदला',
    },
    description: {
      en: 'Follow the journey from Parliament’s first attempt to regulate the East India Company to administrative centralisation, legislative reform and the move towards competitive civil-service recruitment.',
      hi: 'ईस्ट इंडिया कंपनी को नियंत्रित करने के संसद के पहले प्रयास से लेकर प्रशासनिक केंद्रीकरण, विधायी सुधार और प्रतियोगी सिविल सेवा भर्ती की दिशा तक की यात्रा समझें।',
    },
    storyInOneView: {
      en: 'The story in one view',
      hi: 'पूरी कहानी एक नज़र में',
    },
    transformationFlow: {
      en: 'Parliamentary regulation → Judicial correction → Dual control → Charter renewal → Trade monopoly decline → Administrative centralisation → Legislative and recruitment reform',
      hi: 'संसदीय विनियमन → न्यायिक सुधार → द्वैध नियंत्रण → चार्टर नवीनीकरण → व्यापारिक एकाधिकार में गिरावट → प्रशासनिक केंद्रीकरण → विधायी और भर्ती सुधार',
    },
    storyStages: [
      {
        id: 'regulation-begins',
        icon: 'landmark' as const,
        dateRange: '1773–1781',
        title: { en: 'Regulation begins', hi: 'विनियमन की शुरुआत' },
        text: {
          en: 'Parliament begins supervising Company administration.',
          hi: 'संसद ने कंपनी प्रशासन पर निगरानी शुरू की।',
        },
      },
      {
        id: 'political-control',
        icon: 'scale' as const,
        dateRange: '1784',
        title: { en: 'Political control strengthens', hi: 'राजनीतिक नियंत्रण मजबूत हुआ' },
        text: {
          en: 'Judicial limits are clarified and the Board of Control is created.',
          hi: 'न्यायिक सीमाएँ स्पष्ट हुईं और बोर्ड ऑफ कंट्रोल बनाया गया।',
        },
      },
      {
        id: 'trade-declines',
        icon: 'ship' as const,
        dateRange: '1813–1833',
        title: { en: 'Company trade declines', hi: 'कंपनी का व्यापार घटा' },
        text: {
          en: 'The monopoly is first reduced and then the Company’s commercial role ends.',
          hi: 'पहले व्यापारिक एकाधिकार सीमित हुआ, फिर कंपनी की वाणिज्यिक भूमिका समाप्त हुई।',
        },
      },
      {
        id: 'admin-evolves',
        icon: 'building' as const,
        dateRange: '1853',
        title: { en: 'Administration and legislation evolve', hi: 'प्रशासन और विधान विकसित हुए' },
        text: {
          en: 'The legislative structure expands and competitive recruitment becomes the new direction.',
          hi: 'विधायी संरचना का विस्तार हुआ और प्रतियोगी भर्ती की दिशा बनी।',
        },
      },
    ],
    timelineTitle: {
      en: 'Seven Acts Timeline (1773–1853)',
      hi: 'सात अधिनियम समयरेखा (1773–1853)',
    },
    timelineHint: {
      en: 'Select a year to jump to the Act',
      hi: 'किसी वर्ष पर क्लिक करें और उस Act पर जाएँ',
    },
    legend: [
      { category: 'control' as const, label: { en: 'Control', hi: 'नियंत्रण' } },
      { category: 'judiciary' as const, label: { en: 'Judiciary', hi: 'न्यायपालिका' } },
      { category: 'trade' as const, label: { en: 'Trade', hi: 'व्यापार' } },
      { category: 'administration' as const, label: { en: 'Administration', hi: 'प्रशासन' } },
      { category: 'legislation' as const, label: { en: 'Legislation & Recruitment', hi: 'विधान और भर्ती' } },
    ],
    statusLabels: {
      completed: { en: 'Completed', hi: 'पूर्ण' },
      current: { en: 'Current Act', hi: 'वर्तमान अधिनियम' },
      upcoming: { en: 'Upcoming', hi: 'आगामी' },
    },
    quickRecall: [
      { value: '7', label: { en: 'Acts', hi: 'अधिनियम' } },
      { value: '80', label: { en: 'Years', hi: 'वर्ष' } },
      { value: '1', label: { en: 'Constitutional Story', hi: 'संवैधानिक कहानी' } },
    ],
    memoryStrip: {
      en: '1773 Control → 1781 Correction → 1784 Dual Control → 1793 Continuity → 1813 Monopoly Reduced → 1833 Trade Ends → 1853 Council Evolves',
      hi: '1773 नियंत्रण → 1781 सुधार → 1784 द्वैध नियंत्रण → 1793 निरंतरता → 1813 एकाधिकार सीमित → 1833 व्यापार समाप्त → 1853 परिषद का विकास',
    },
    tip: {
      en: 'Tip: Learn the Master Memory Path first, then the Seven Acts in order.',
      hi: 'सुझाव: पहले मास्टर मेमोरी पथ सीखें, फिर सात अधिनियम क्रम से।',
    },
    continuation: {
      en: 'Now study each Act in detail',
      hi: 'अब प्रत्येक अधिनियम को विस्तार से पढ़ें',
    },
    milestones: [
      {
        id: 'regulating-act-1773',
        year: '1773',
        name: { en: 'Regulating Act', hi: 'Regulating Act' },
        summary: {
          en: 'Parliament’s first major step to regulate Company administration in India.',
          hi: 'भारत में कंपनी प्रशासन को नियंत्रित करने की संसद की पहली बड़ी पहल।',
        },
        keyChange: {
          en: 'Parliamentary control begins',
          hi: 'संसदीय नियंत्रण की शुरुआत',
        },
        category: 'control' as const,
      },
      {
        id: 'act-of-settlement-1781',
        year: '1781',
        name: { en: 'Act of Settlement', hi: 'Act of Settlement' },
        summary: {
          en: 'Clarified the Supreme Court’s jurisdiction and corrected conflicts created after 1773.',
          hi: 'सुप्रीम कोर्ट के अधिकार-क्षेत्र को स्पष्ट किया और 1773 के बाद उत्पन्न टकरावों को सुधारा।',
        },
        keyChange: { en: 'Judicial correction', hi: 'न्यायिक सुधार' },
        category: 'judiciary' as const,
      },
      {
        id: 'pitts-india-act-1784',
        year: '1784',
        name: { en: "Pitt's India Act", hi: "Pitt's India Act" },
        summary: {
          en: 'Created the Board of Control and strengthened British government control over political affairs.',
          hi: 'बोर्ड ऑफ कंट्रोल बनाया और राजनीतिक मामलों पर ब्रिटिश सरकार का नियंत्रण मजबूत किया।',
        },
        keyChange: { en: 'Dual control', hi: 'द्वैध नियंत्रण' },
        category: 'control' as const,
      },
      {
        id: 'charter-act-1793',
        year: '1793',
        name: { en: 'Charter Act', hi: 'Charter Act' },
        summary: {
          en: 'Renewed the Company’s charter and largely continued the existing control system.',
          hi: 'कंपनी के चार्टर का नवीनीकरण किया और मौजूदा नियंत्रण व्यवस्था को मुख्यतः जारी रखा।',
        },
        keyChange: { en: 'Continuity and renewal', hi: 'निरंतरता और नवीनीकरण' },
        category: 'control' as const,
      },
      {
        id: 'charter-act-1813',
        year: '1813',
        name: { en: 'Charter Act', hi: 'Charter Act' },
        summary: {
          en: 'Ended the Company’s trade monopoly in India, except the tea trade and trade with China.',
          hi: 'चाय के व्यापार और चीन के साथ व्यापार को छोड़कर भारत में कंपनी का व्यापारिक एकाधिकार समाप्त किया।',
        },
        keyChange: { en: 'Monopoly breached', hi: 'एकाधिकार सीमित' },
        category: 'trade' as const,
      },
      {
        id: 'charter-act-1833',
        year: '1833',
        name: { en: 'Charter Act', hi: 'Charter Act' },
        summary: {
          en: 'Ended the Company’s commercial activities and made the Governor-General of Bengal the Governor-General of India.',
          hi: 'कंपनी की वाणिज्यिक गतिविधियाँ समाप्त कीं और बंगाल के गवर्नर-जनरल को भारत का गवर्नर-जनरल बनाया।',
        },
        keyChange: { en: 'Administrative centralisation', hi: 'प्रशासनिक केंद्रीकरण' },
        category: 'administration' as const,
      },
      {
        id: 'charter-act-1853',
        year: '1853',
        name: { en: 'Charter Act', hi: 'Charter Act' },
        summary: {
          en: 'Separated the legislative and executive work of the Governor-General’s Council and opened the way for competitive civil-service recruitment.',
          hi: 'गवर्नर-जनरल की परिषद के विधायी और कार्यकारी कार्यों को अलग किया तथा प्रतियोगी सिविल सेवा भर्ती का मार्ग खोला।',
        },
        keyChange: { en: 'Legislative evolution', hi: 'विधायी विकास' },
        category: 'legislation' as const,
      },
    ],
  },

  regulatingAct1773Section: {
    chapterNumber: '01',
    year: '1773',
    title: {
      en: 'Parliament enters Company government',
      hi: 'कंपनी शासन में संसद का प्रवेश',
    },
    identityBadge: {
      en: 'Parliamentary control begins',
      hi: 'संसदीय नियंत्रण की शुरुआत',
    },
    markRevised: { en: 'Mark revised', hi: 'दोहराया गया चिह्नित करें' },
    revised: { en: 'Revised', hi: 'दोहराया गया' },
    signInToSave: {
      en: 'Sign in to save revision progress',
      hi: 'रिवीजन प्रगति सहेजने के लिए साइन इन करें',
    },
    whyIntervened: {
      heading: { en: 'Why did Parliament intervene?', hi: 'संसद को हस्तक्षेप क्यों करना पड़ा?' },
      text: {
        en: 'The Company’s territorial and revenue power had grown, but its administration faced financial stress, corruption complaints and weak accountability. Parliament intervened because a commercial corporation was now exercising governmental power.',
        hi: 'कंपनी की क्षेत्रीय और राजस्व शक्ति बढ़ चुकी थी, लेकिन उसके प्रशासन पर आर्थिक संकट, भ्रष्टाचार और कमजोर जवाबदेही के आरोप थे। संसद ने इसलिए हस्तक्षेप किया क्योंकि एक व्यापारिक निगम अब शासन-सत्ता का प्रयोग कर रहा था।',
      },
    },
    keyFeatures: {
      heading: {
        en: 'Key Features of the Regulating Act, 1773',
        hi: 'रेगुलेटिंग एक्ट, 1773 के मुख्य प्रावधान',
      },
      items: [
        {
          id: 'constitutional',
          icon: 'landmark' as const,
          text: {
            en: 'The first major Parliamentary measure to regulate the Company’s territorial administration in India.',
            hi: 'भारत में कंपनी के क्षेत्रीय प्रशासन को नियंत्रित करने वाला पहला प्रमुख संसदीय उपाय।',
          },
        },
        {
          id: 'central-executive',
          icon: 'crown' as const,
          text: {
            en: 'The Governor of Bengal was elevated to the Governor-General of Fort William in Bengal, commonly called the Governor-General of Bengal.',
            hi: 'बंगाल के गवर्नर को फोर्ट विलियम, बंगाल का गवर्नर-जनरल बनाया गया, जिसे सामान्यतः बंगाल का गवर्नर-जनरल कहा जाता है।',
          },
        },
        {
          id: 'first-holder',
          icon: 'user' as const,
          text: {
            en: 'Warren Hastings became the first Governor-General under this arrangement.',
            hi: 'वॉरेन हेस्टिंग्स इस व्यवस्था के अंतर्गत पहले गवर्नर-जनरल बने।',
          },
        },
        {
          id: 'council',
          icon: 'users' as const,
          text: {
            en: 'The Governor-General worked with a four-member Council. Ordinary decisions were taken by majority, with a casting vote for the Governor-General in a tie.',
            hi: 'गवर्नर-जनरल के साथ चार-सदस्यीय परिषद थी। सामान्य निर्णय बहुमत से होते थे और मत बराबर होने पर गवर्नर-जनरल को निर्णायक मत प्राप्त था।',
          },
        },
        {
          id: 'presidencies',
          icon: 'building' as const,
          text: {
            en: 'Madras and Bombay were placed under Bengal’s superior control in specified important matters, especially war and treaty policy.',
            hi: 'मद्रास और बंबई को निर्धारित महत्वपूर्ण मामलों, विशेषकर युद्ध और संधि नीति में बंगाल के उच्च नियंत्रण के अधीन किया गया।',
          },
        },
        {
          id: 'supreme-court',
          icon: 'scale' as const,
          text: {
            en: 'The Act provided for a Supreme Court at Fort William. The Court was actually established in 1774 through the Crown’s Letters Patent.',
            hi: 'अधिनियम ने फोर्ट विलियम में सुप्रीम कोर्ट का प्रावधान किया। न्यायालय वास्तव में 1774 में क्राउन के लेटर्स पेटेंट द्वारा स्थापित हुआ।',
          },
        },
        {
          id: 'oversight',
          icon: 'shield' as const,
          text: {
            en: 'Company correspondence concerning revenue, civil and military affairs had to be reported to British authorities.',
            hi: 'राजस्व, दीवानी और सैन्य मामलों से संबंधित कंपनी के पत्राचार को ब्रिटिश अधिकारियों तक भेजना आवश्यक था।',
          },
        },
      ],
    },
    adminStructure: {
      heading: {
        en: 'Administrative structure under the Act',
        hi: 'अधिनियम के अंतर्गत प्रशासनिक संरचना',
      },
      governorExisting: { en: 'Governor of Bengal', hi: 'बंगाल का गवर्नर' },
      elevatedTo: {
        en: 'Governor-General of Fort William in Bengal',
        hi: 'फोर्ट विलियम, बंगाल का गवर्नर-जनरल',
      },
      firstHolder: { en: 'Warren Hastings', hi: 'वॉरेन हेस्टिंग्स' },
      council: { en: 'Four-member Council', hi: 'चार-सदस्यीय परिषद' },
      presidencies: [
        { en: 'Madras Presidency', hi: 'मद्रास प्रेसidency' },
        { en: 'Bombay Presidency', hi: 'बंबई प्रेसidency' },
      ],
      qualifier: {
        en: 'In specified important matters, especially war and treaty policy',
        hi: 'निर्धारित महत्वपूर्ण मामलों में, विशेषकर युद्ध और संधि नीति में',
      },
    },
    supremeCourtFacts: {
      heading: { en: 'Supreme Court fact card', hi: 'सुप्रीम कोर्ट तथ्य-पत्र' },
      actHighlight: { en: 'Act: 1773', hi: 'अधिनियम: 1773' },
      establishedHighlight: { en: 'Court established: 1774', hi: 'न्यायालय स्थापित: 1774' },
      rows: [
        {
          label: { en: 'Statutory provision', hi: 'वैधानिक प्रावधान' },
          value: { en: 'Regulating Act, 1773', hi: 'रेगुलेटिंग एक्ट, 1773' },
        },
        {
          label: { en: 'Establishing instrument', hi: 'स्थापना का साधन' },
          value: { en: 'Letters Patent dated 26 March 1774', hi: '26 मार्च 1774 के लेटर्स पेटेंट' },
        },
        {
          label: { en: 'Location', hi: 'स्थान' },
          value: { en: 'Fort William at Calcutta', hi: 'फोर्ट विलियम, कलकत्ता' },
        },
        {
          label: { en: 'Composition', hi: 'संरचना' },
          value: { en: '1 Chief Justice + 3 puisne judges', hi: '1 मुख्य न्यायाधीश + 3 अवर न्यायाधीश' },
        },
        {
          label: { en: 'First Chief Justice', hi: 'प्रथम मुख्य न्यायाधीश' },
          value: { en: 'Sir Elijah Impey', hi: 'सर एलिजाह इम्पे' },
        },
        {
          label: { en: 'Appeal', hi: 'अपील' },
          value: { en: 'King-in-Council', hi: 'किंग-इन-काउंसिल' },
        },
      ],
    },
    conflict: {
      heading: { en: 'Why did the arrangement create conflict?', hi: 'व्यवस्था से टकराव क्यों उत्पन्न हुआ?' },
      points: [
        {
          en: 'The relationship between the Supreme Court and the Company’s Adalats was not clearly defined.',
          hi: 'सुप्रीम कोर्ट और कंपनी की अदालतों के बीच संबंध स्पष्ट नहीं था।',
        },
        {
          en: 'The extent of the Supreme Court’s jurisdiction over Indians, officials and revenue matters caused conflict.',
          hi: 'भारतीयों, अधिकारियों और राजस्व मामलों पर सुप्रीम कोर्ट की अधिकारिता को लेकर टकराव हुआ।',
        },
        {
          en: 'The Governor-General could be defeated by the majority of his own Council.',
          hi: 'गवर्नर-जनरल अपनी ही परिषद के बहुमत से पराजित हो सकता था।',
        },
        {
          en: 'The Act began Parliamentary control but did not create a complete and harmonious constitutional system.',
          hi: 'अधिनियम ने संसदीय नियंत्रण शुरू किया, लेकिन पूर्ण और संतुलित संवैधानिक व्यवस्था नहीं बनाई।',
        },
      ],
      bridge: {
        en: 'These conflicts led to the corrective Act of 1781.',
        hi: 'इन्हीं टकरावों के कारण 1781 का सुधारात्मक अधिनियम आया।',
      },
    },
    advancedExam: {
      heading: { en: 'Advanced exam details', hi: 'उन्नत परीक्षा तथ्य' },
      items: [
        { en: 'The Court of Directors continued with 24 members.', hi: 'कोर्ट ऑफ डायरेक्टर्स में 24 सदस्य रहे।' },
        {
          en: 'Directors received staggered four-year terms; one-fourth, or six, retired each year.',
          hi: 'निदेशकों का क्रमिक कार्यकाल चार वर्ष था; हर वर्ष एक-चौथाई, अर्थात छह निदेशक सेवानिवृत्त होते थे।',
        },
        {
          en: 'The minimum Company-stock qualification for voting in the Court of Proprietors was raised to £1,000.',
          hi: 'कोर्ट ऑफ प्रोप्राइटर्स में मतदान के लिए न्यूनतम कंपनी-शेयर योग्यता £1,000 की गई।',
        },
        { en: 'Revenue correspondence was sent to the Treasury.', hi: 'राजस्व संबंधी पत्राचार ट्रेजरी को भेजा जाता था।' },
        {
          en: 'Civil and military correspondence went to a Secretary of State.',
          hi: 'दीवानी और सैन्य पत्राचार सेक्रेटरी ऑफ स्टेट को भेजा जाता था।',
        },
        {
          en: 'The Governor-General could break an equal vote but could not generally overrule a clear majority of the four councillors.',
          hi: 'गवर्नर-जनरल बराबरी की स्थिति में निर्णायक मत दे सकता था, लेकिन चार पार्षदों के स्पष्ट बहुमत को सामान्यतः निरस्त नहीं कर सकता था।',
        },
      ],
    },
    examTrap: {
      heading: { en: 'Exam Trap', hi: 'परीक्षा में भ्रम' },
      text: {
        en: 'The Act was passed in 1773, but the Supreme Court was established in 1774. The Board of Control belongs to Pitt’s India Act, 1784—not the Regulating Act.',
        hi: 'अधिनियम 1773 में पारित हुआ, लेकिन सुप्रीम कोर्ट 1774 में स्थापित हुआ। बोर्ड ऑफ कंट्रोल पिट्स इंडिया एक्ट, 1784 से संबंधित है—रेगुलेटिंग एक्ट से नहीं।',
      },
    },
    memoryFormula: {
      heading: { en: 'Memory Formula', hi: 'याद रखने की ट्रिक' },
      formula: {
        en: '1773 = Parliament + Governor-General of Bengal + Council of Four + Supreme Court provision',
        hi: '1773 = संसद + बंगाल का गवर्नर-जनरल + चार-सदस्यीय परिषद + सुप्रीम कोर्ट का प्रावधान',
      },
    },
    nextAct: {
      label: { en: 'Next Act • 1781', hi: 'अगला अधिनियम • 1781' },
      title: {
        en: 'Act of Settlement: Correcting the judicial conflict',
        hi: 'एक्ट ऑफ सेटलमेंट: न्यायिक टकराव का सुधार',
      },
      button: { en: 'Continue to 1781', hi: '1781 के अधिनियम पर जाएँ' },
      comingSoon: { en: 'Coming in the next chapter', hi: 'अगले अध्याय में उपलब्ध होगा' },
      targetId: 'act-of-settlement-1781',
    },
    chapterRailTitle: {
      en: 'Regulating Acts & Company Rule',
      hi: 'रेगुलेटिंग अधिनियम और कंपनी शासन',
    },
    chapterRailCurrent: { en: 'Current', hi: 'वर्तमान' },
    chapterRailUpcoming: { en: 'Upcoming', hi: 'आगामी' },
  },

  pageRoadmap: [
    { id: 'charter-need', label: { en: 'Introduction and background', hi: 'परिचय और पृष्ठभूमि' } },
    { id: 'charter-meaning', label: { en: 'Company charters and privileges', hi: 'Company के चार्टर और विशेषाधिकार' } },
    { id: 'company-entry-in-bengal', label: { en: 'From trader to ruler', hi: 'व्यापारी से शासक तक का सफर' } },
    { id: 'dual-government', label: { en: 'Early Acts and their impact', hi: 'प्रारंभिक अधिनियम और उनका प्रभाव' } },
  ],

  topicOverview: [
    {
      icon: 'calendar' as const,
      title: { en: 'Period', hi: 'कालखंड' },
      primaryDetail: { en: '1600 – 1858', hi: '1600 – 1858' },
      text: { en: 'From rise of the Company to Crown Rule', hi: 'Company के उदय से Crown Rule तक' },
    },
    {
      icon: 'landmark' as const,
      title: { en: 'Nature', hi: 'प्रकृति' },
      text: { en: 'Trading institution to political power', hi: 'व्यापारिक संस्था से राजनीतिक शक्ति तक का परिवर्तन' },
    },
    {
      icon: 'mapPin' as const,
      title: { en: 'Region', hi: 'क्षेत्र' },
      text: { en: 'Gradual expansion across India', hi: 'भारत के विभिन्न भागों में क्रमिक विस्तार' },
    },
    {
      icon: 'bookOpen' as const,
      title: { en: 'Significance', hi: 'महत्व' },
      text: { en: 'Foundation of modern administrative structure', hi: 'आधुनिक भारत के प्रशासनिक ढांचे की नींव' },
    },
  ],

  /** Sticky section nav — subset of full roadmap for quick jump */
  stickyNavIds: [
    'charter-need',
    'charter-meaning',
    'company-entry-in-bengal',
    'trade-misuse',
    'company-nawab-conflict',
    'battle-of-plassey',
    'battle-of-buxar',
    'diwani',
    'dual-government',
    'exam-traps',
    'mindmap',
    'practice',
  ] as const,

  /** Derived from revisionSections for backward compatibility */
  get roadmap() {
    return revisionSections
      .filter((s) => !['practice', 'mindmap'].includes(s.id))
      .map(({ id, title }) => ({ id, ...title }));
  },

  get nav() {
    return revisionSections.map(({ id, navLabel }) => ({ id, ...navLabel }));
  },

  sections: {
    charterNeed: {
      cards: [
        {
          title: { en: 'High demand for Indian goods in Europe', hi: 'यूरोप में भारतीय वस्तुओं की बहुत मांग' },
          text: { en: 'Indian spices, cloth, indigo, fibre, sugar and precious goods were very popular in Europe.', hi: 'भारत के मसाले, कपड़े, नील, रेशा, शक्कर और कीमती वस्तुएं यूरोप में बहुत लोकप्रिय थी।' },
        },
        {
          title: { en: 'Need for legal permission', hi: 'कानूनी अनुमति की आवश्यकता' },
          text: { en: 'English traders needed legal recognition from the British government to trade in India.', hi: 'अंग्रेज व्यापारियों को भारत में व्यापार के लिए ब्रिटिश सरकार से कानूनी मान्यता चाहिए थी।' },
        },
        {
          title: { en: 'Competition among English traders', hi: 'अंग्रेज व्यापारियों में प्रतिस्पर्धा' },
          text: { en: 'Many English traders operated separately, increasing mutual competition and disorder.', hi: 'कई अंग्रेज व्यापारी अलग-अलग व्यापार कर रहे थे, जिससे आपसी प्रतिस्पर्धा और अव्यवस्था बढ़ रही थी।' },
        },
        {
          title: { en: 'Need for one authorised company', hi: 'एक अधिकृत कंपनी की जरूरत' },
          text: { en: 'The government decided to grant trading rights in India to a single authorised company.', hi: 'सरकार ने एक ही अधिकृत कंपनी को भारत में व्यापार का अधिकार देने का निर्णय लिया।' },
        },
        {
          title: { en: 'Organising long-distance trade', hi: 'लंबी दूरी के व्यापार को संगठित करना' },
          text: { en: 'An organised system was needed to make trade secure, orderly and long-term.', hi: 'व्यापार को सुरक्षित, व्यवस्थित और दीर्घकालीन बनाने के लिए एक संगठित व्यवस्था जरूरी थी।' },
        },
      ],
      takeaway: {
        en: 'The Charter was needed to give trade a legal, organised and controlled form.',
        hi: 'Charter की जरूरत व्यापार को कानूनी, संगठित और नियंत्रित रूप देने के लिए पड़ी।',
      },
    },

    charterMeaning: {
      columns: [
        {
          title: { en: 'What was granted?', hi: 'क्या मिला?' },
          items: [
            { en: 'Right to trade with eastern countries', hi: 'पूर्व के देशों के साथ व्यापार करने का अधिकार' },
            { en: 'Right to establish factories and warehouses', hi: 'कारखाने (Factories) और गोदाम स्थापित करने का अधिकार' },
            { en: 'Right to buy, sell and transport goods', hi: 'माल खरीदने, बेचने और ले जाने का अधिकार' },
            { en: 'Right to appoint its officers and employees', hi: 'अपने अधिकारियों और कर्मचारियों की नियुक्ति का अधिकार' },
            { en: 'Right to make laws for company affairs (limited to company members only)', hi: 'कंपनी के कामकाज के लिए कानून बनाने का अधिकार (केवल कंपनी के सदस्यों तक सीमित)' },
          ],
        },
        {
          title: { en: 'What was NOT granted?', hi: 'क्या नहीं मिला?' },
          items: [
            { en: 'No sovereignty', hi: 'सार्वभौमिकता (Sovereignty) नहीं' },
            { en: 'No power to collect revenue', hi: 'राजस्व वसूलने की शक्ति नहीं' },
            { en: 'No right to run territorial administration', hi: 'क्षेत्रीय प्रशासन चलाने का अधिकार नहीं' },
            { en: 'No power to rule over any territory', hi: 'किसी क्षेत्र पर शासन करने की शक्ति नहीं' },
            { en: 'Law-making power limited only to internal company matters', hi: 'कानून बनाने की शक्ति केवल कंपनी के आंतरिक मामलों तक सीमित' },
          ],
        },
        {
          title: { en: 'Easy Line', hi: 'Easy Line' },
          highlight: {
            en: 'Commercial privilege was granted, not territorial sovereignty',
            hi: 'व्यापार का अधिकार मिला, Territorial sovereignty नहीं।',
          },
        },
      ],
      timeline: { en: 'Beginning of trade, not rule', hi: 'Trade की शुरुआत, शासन की नहीं' },
      memory: { en: 'Charter = Trade Right, not Territorial Rule', hi: 'Charter = Trade Right, not Territorial Rule' },
    },

    bengalEntry: {
      chapterTag: { en: 'Chapter 1 • Rule and Early Acts', hi: 'Chapter 1 • Rule and Early Acts' },
      sceneTitle: {
        en: 'Scene at Hugli (c. 17th century)',
        hi: 'Hugli का दृश्य (लगभग 17वीं सदी)',
      },
      timeline: [
        {
          year: '1651',
          accent: 'purple' as const,
          text: { en: 'First English factory established on the Hugli', hi: 'Hugli में पहली English factory की स्थापना' },
        },
        {
          year: '1696',
          accent: 'green' as const,
          text: { en: 'Beginning of fortification', hi: 'Fortification की शुरुआत' },
        },
        {
          accent: 'blue' as const,
          title: { en: 'Three villages received', hi: 'तीन गाँव प्राप्त' },
          sub: { en: 'Sutanuti, Govindpur, Kalikata', hi: 'Sutanuti, Govindpur, Kalikata' },
        },
        {
          accent: 'orange' as const,
          title: { en: 'Rise of Kalikata', hi: 'Kalikata का उदय' },
          sub: { en: 'Foundation of future Calcutta', hi: 'भविष्य के Calcutta की नींव' },
        },
      ],
      cards: [
        {
          title: { en: 'First Factory', hi: 'पहली Factory' },
          text: {
            en: 'In 1651 the Company set up its first English factory on the banks of the Hugli river in Bengal.',
            hi: '1651 में Company ने Bengal में Hugli (Hooghly) नदी के किनारे अपनी factory स्थापित की।',
          },
          accent: 'purple' as const,
        },
        {
          title: { en: 'Who were Factors?', hi: 'Factors कौन थे?' },
          text: {
            en: 'The Company\'s commercial agents and employees were called factors — they bought goods, stored them and kept trade accounts.',
            hi: 'Company के व्यापारिक agents और employees को factors कहा जाता था। वे वस्तुएँ खरीदते, जमा करते और व्यापारिक हिसाब रखते थे।',
          },
          accent: 'green' as const,
        },
        {
          title: { en: 'Meaning of Factory', hi: 'Factory का मतलब' },
          text: {
            en: 'At that time factory did not mean a manufacturing plant — it was a trading post, warehouse and settlement for Company officials.',
            hi: 'उस समय factory का मतलब manufacturing plant नहीं था। यह trading post, warehouse और Company officials का settlement होता था।',
          },
          accent: 'orange' as const,
        },
        {
          title: { en: 'Three Villages and Kalikata', hi: 'तीन गाँव और Kalikata' },
          text: {
            en: 'The Company received three villages named Sutanuti, Govindpur and Kalikata, which later became Calcutta.',
            hi: 'Company को Sutanuti, Govindpur और Kalikata नाम के तीन गाँव मिले, जिनसे आगे चलकर Calcutta बना।',
          },
          accent: 'blue' as const,
        },
      ],
      sceneAnnotations: [
        { id: 'ship', label: { en: 'Company Ship', hi: 'Company Ship' }, top: '10%', left: '5%' },
        { id: 'warehouse', label: { en: 'Warehouse', hi: 'Warehouse' }, top: '12%', left: '58%' },
        {
          id: 'settlement',
          label: { en: 'Small Fortified Settlement', hi: 'छोटा Fortified Settlement' },
          top: '62%',
          left: '68%',
        },
        {
          id: 'traders',
          label: { en: 'Traders and Account Books', hi: 'Traders और Account Books' },
          top: '72%',
          left: '8%',
        },
      ],
      memory: { en: 'Factory = Trading Centre, not a modern manufacturing unit', hi: 'Factory = Trading Centre, न कि modern manufacturing unit' },
      examTakeaway: { en: '1651 — Hugli factory | 1696 — Fortification', hi: '1651 — Hugli factory | 1696 — Fortification' },
    },

    tradeMisuse: {
      sectionLabel: { en: 'Section 5.A', hi: 'Section 5.A' },
      examNoteBanner: {
        en: 'This topic is important from an exam perspective.',
        hi: 'यह टॉपिक परीक्षा की दृष्टि से महत्वपूर्ण है।',
      },
      comparisonHeading: {
        en: 'Official Company Trade vs Private Trade of Officials',
        hi: 'Official Company Trade vs Private Trade of Officials',
      },
      flowHeading: {
        en: 'Privilege Misuse → Revenue Loss (4-Step Flow)',
        hi: 'Privilege Misuse → राजस्व हानि (4-Step Flow)',
      },
      officialTrade: {
        title: { en: 'Official Company Trade', hi: 'Official Company Trade' },
        points: [
          { en: 'Trade covered by the Company\'s authorised privileges (e.g. under relevant farmans/dastaks within their scope)', hi: 'Company के authorised privileges के अंतर्गत व्यापार (जैसे संबंधित farman/dastak की सीमा में)' },
          { en: 'Official Company goods/pass arrangements where historically applicable', hi: 'जहाँ लागू हो, official Company goods/pass की व्यवस्था' },
          { en: 'Permitted within the limits of the concession — not a blanket exemption for all goods', hi: 'Concession की सीमा के भीतर अनुमति — सभी वस्तुओं पर सार्वभौमिक छूट नहीं' },
        ],
      },
      privateTrade: {
        title: { en: 'Private Trade of Officials', hi: 'Private Trade of Officials' },
        points: [
          { en: 'Personal commercial activity by Company servants', hi: 'Company servants का personal commercial activity' },
          { en: 'Private goods passed off using Company privilege/pass mechanisms', hi: 'Company privilege/pass का उपयोग कर private goods का passage' },
          { en: 'Customs obstruction, unequal treatment and revenue loss for the Nawab', hi: 'Customs पर बाधा, असमान व्यवहार और Nawab की revenue loss' },
        ],
      },
      flowSteps: [
        {
          title: { en: 'Misuse of dastak/pass', hi: 'दस्तक का दुरुपयोग' },
          text: { en: 'Officials used Company pass mechanisms for private goods where supported by evidence.', hi: 'Officials ने private goods के लिए Company pass/dastak mechanisms का दुरुपयोग किया।' },
        },
        {
          title: { en: 'Obstruction in duty collection', hi: 'कर वसूली में बाधा' },
          text: { en: 'Pressure or avoidance at customs/checkpoints.', hi: 'Customs/checkpoints पर दबाव या कर से बचाव।' },
        },
        {
          title: { en: 'Merchant discontent', hi: 'व्यापारियों में असंतोष' },
          text: { en: 'Local merchants faced disadvantage; complaints and conflict grew.', hi: 'स्थानीय व्यापारियों को नुकसान; शिकायतें और conflict बढ़ा।' },
        },
        {
          title: { en: 'Revenue loss', hi: 'राजस्व हानि' },
          text: { en: 'Customs revenue to the Nawab\'s administration declined.', hi: 'Nawab के prashasan को customs revenue में कमी।' },
        },
      ],
      examNote: {
        en: 'Company privilege and Company officials\' private trade were not the same thing.',
        hi: 'Company का privilege और Company officials का private trade एक ही बात नहीं थे।',
      },
      takeaway: {
        en: 'Misuse of trade privileges by Company officials became an important cause of revenue loss and growing conflict with the Nawab.',
        hi: 'Company अधिकारियों द्वारा trade privileges का misuse Nawab के लिए revenue loss और बढ़ते conflict का महत्वपूर्ण कारण बना।',
      },
    },

    nawabConflict: {
      sectionLabel: { en: 'Section 5.B', hi: 'Section 5.B' },
      causesHeading: { en: 'Main Reasons', hi: 'मुख्य कारण' },
      causes: [
        {
          title: { en: 'Revenue loss', hi: 'राजस्व हानि' },
          text: { en: 'Misuse of customs/trade privileges reduced or threatened the Nawab\'s revenue.', hi: 'Customs/trade privileges के misuse से Nawab की revenue कम या खतरे में पड़ी।' },
          accent: 'purple' as const,
        },
        {
          title: { en: 'Fortification', hi: 'किलेबंदी (Fortification)' },
          text: { en: 'Company fortification or strengthening of settlements without acceptable Nawab permission.', hi: 'Nawab की स्वीकार्य अनुमति के बिना Company की fortification/settlements को मजबूत करना।' },
          accent: 'green' as const,
        },
        {
          title: { en: 'Political interference', hi: 'राजनीतिक हस्तक्षेप' },
          text: { en: 'Company involvement in court politics, succession disputes or political pressure.', hi: 'Court politics, succession disputes और political pressure में Company का हस्तक्षेप।' },
          accent: 'blue' as const,
        },
        {
          title: { en: 'Defiance of Nawab\'s authority', hi: 'Nawab के अधिकार की अवहेलना' },
          text: { en: 'Company officials increasingly resisted the Nawab\'s orders and revenue demands.', hi: 'Company officials ने Nawab के आदेशों और revenue demands का विरोध बढ़ाया।' },
          accent: 'orange' as const,
        },
        {
          title: { en: 'Coinage dispute', hi: 'सिक्के चलाने/टकसाल से संबंधित विवाद' },
          text: { en: 'Nawabs did not allow the Company unrestricted coin minting on its own terms.', hi: 'Nawabs ने Company को अपनी इच्छानुसार unrestricted coin minting की स्वतंत्रता नहीं दी।' },
          accent: 'purple' as const,
        },
      ],
      nawabTimelineHeading: { en: 'Selected brief Nawab timeline', hi: 'Nawabs की संक्षिप्त समयरेखा' },
      nawabTimelineNote: {
        en: 'This is an exam-focused selected timeline; not all intervening Nawabs are shown.',
        hi: 'यह परीक्षा-केंद्रित चयनित समयरेखा है; बीच के सभी Nawabs प्रदर्शित नहीं हैं।',
      },
      nawabLine: [
        {
          name: { en: 'Murshid Quli Khan', hi: 'Murshid Quli Khan' },
          reign: '1717–1727',
          text: { en: 'Strengthened Bengal administration and revenue; maintained controlled relations with the Company.', hi: 'Bengal administration और revenue को मजबूत किया; Company के साथ नियंत्रित relations।' },
        },
        {
          name: { en: 'Alivardi Khan', hi: 'Alivardi Khan' },
          reign: '1740–1756',
          text: { en: 'Checked Company ambitions including fortification; sought to preserve Nawabi authority.', hi: 'Fortification सहित Company की ambitions को रोका; Nawabi authority बनाए रखना चाहा।' },
        },
        {
          name: { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' },
          reign: '1756–1757',
          text: { en: 'Conflict escalated over fortification, privileges and authority — leading toward Plassey.', hi: 'Fortification, privileges और authority पर conflict तेज़ हुआ — Plassey की ओर।' },
        },
      ],
      takeaway: {
        en: 'Link the causes of conflict with the Nawabs\' chronology — it clarifies the sequence of events.',
        hi: 'टकराव के कारणों को Nawabs की समयरेखा के साथ जोड़कर याद करें—इससे घटनाओं का क्रम स्पष्ट रहेगा।',
      },
    },

    plassey: {
      headerSubtitle: {
        en: 'A decisive political-military conflict that rapidly expanded Company influence in Bengal.',
        hi: 'एक निर्णायक राजनीतिक-सैन्य संघर्ष जिसने Bengal में Company के प्रभाव को तेजी से बढ़ाया।',
      },
      eventSteps: [
        {
          title: { en: 'Sirajuddaulah becomes Nawab (1756)', hi: 'Sirajuddaulah बना Nawab (1756)' },
          text: { en: 'Succeeded Alivardi Khan as Nawab of Bengal after his death.', hi: 'Alivardi Khan की मृत्यु के बाद Bengal का Nawab बना।' },
          scene: 'sirajuddaulah' as const,
        },
        {
          title: { en: 'Seizure of Kasimbazar (June 1756)', hi: 'Kasimbazar पर कब्जा (June 1756)' },
          text: { en: 'Sirajuddaulah seized the Company\'s Kasimbazar factory amid growing conflict.', hi: 'बढ़ते conflict के बीच Sirajuddaulah ने Company की Kasimbazar factory पर कब्जा किया।' },
          scene: 'kasimbazar' as const,
        },
        {
          title: { en: 'Clive\'s expedition from Madras', hi: 'Clive का Madras से अभियान' },
          text: { en: 'Company forces under Robert Clive were sent from Madras toward Bengal.', hi: 'Robert Clive के नेतृत्व में Company forces Madras से Bengal की ओर भेजी गईं।' },
          scene: 'clive' as const,
        },
        {
          title: { en: 'Recapture of Calcutta (January 1757)', hi: 'Calcutta पर पुनः अधिकार (January 1757)' },
          text: { en: 'Company forces recaptured Calcutta after earlier Nawabi action against the settlement.', hi: 'Nawabi action के बाद Company forces ने Calcutta पर पुनः अधिकार जमाया।' },
          scene: 'calcutta' as const,
        },
        {
          title: { en: 'Armies at Plassey (23 June 1757)', hi: 'Plassey के मैदान में सेनाएँ (23 June 1757)' },
          text: { en: 'Opposing forces assembled; the decisive engagement took place on 23 June 1757.', hi: 'विरोधी forces एकत्र हुईं; निर्णायक engagement 23 June 1757 को हुआ।' },
          scene: 'plassey-field' as const,
        },
        {
          title: { en: 'Mir Jafar and the conspiracy pact', hi: 'Mir Jafar और षड्यंत्रकारी समझौता' },
          text: { en: 'A secret agreement with Mir Jafar was reached before the battle; parts of the Nawab\'s army did not fight decisively.', hi: 'युद्ध से पहले Mir Jafar के साथ गुप्त समझौता; Nawab की army के कुछ हिस्सों ने निर्णायक रूप से लड़ाई नहीं की।' },
          scene: 'mir-jafar' as const,
        },
        {
          title: { en: 'Battle of Plassey (23 June 1757)', hi: 'Plassey का युद्ध (23 June 1757)' },
          text: { en: 'The Company won; Sirajuddaulah was defeated.', hi: 'Company की विजय; Sirajuddaulah पराजित हुआ।' },
          scene: 'battle' as const,
        },
        {
          title: { en: 'Decisive political advance for the Company', hi: 'Company की निर्णायक राजनीतिक बढ़त' },
          text: { en: 'Victory greatly expanded Company influence over Bengal\'s succession and politics — not instant full territorial rule.', hi: 'विजय ने Bengal की succession और politics पर Company influence का निर्णायक विस्तार किया — तुरंत पूर्ण territorial rule नहीं।' },
          scene: 'fort' as const,
        },
      ],
      summary: [
        { label: { en: 'Year', hi: 'वर्ष (Year)' }, value: { en: '1757', hi: '1757' }, accent: 'purple' as const, icon: 'calendar' as const },
        { label: { en: 'Nawab', hi: 'Nawab' }, value: { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' }, accent: 'green' as const, icon: 'person' as const },
        { label: { en: 'Company Commander', hi: 'Company Commander' }, value: { en: 'Robert Clive', hi: 'Robert Clive' }, accent: 'blue' as const, icon: 'officer' as const },
        {
          label: { en: 'Result', hi: 'परिणाम (Result)' },
          value: {
            en: 'Decisive expansion of Company political influence and interference in Bengal\'s power',
            hi: 'Company के राजनीतिक प्रभाव और Bengal की सत्ता में हस्तक्षेप का निर्णायक विस्तार',
          },
          accent: 'orange' as const,
          icon: 'trophy' as const,
          wide: true,
        },
      ],
      flow: [
        { en: 'Sirajuddaulah became Nawab of Bengal', hi: 'Sirajuddaulah Bengal का Nawab बना' },
        { en: 'Conflict over fortification and authority grew', hi: 'Company और Nawab के बीच fortification तथा authority को लेकर conflict बढ़ा' },
        { en: 'Sirajuddaulah seized the Kassimbazar factory', hi: 'Sirajuddaulah ने Kassimbazar factory पर कब्जा किया' },
        { en: 'Company forces from Madras under Robert Clive arrived', hi: 'Company forces Madras से Robert Clive के नेतृत्व में पहुँचीं' },
        { en: 'Battle of Plassey — 1757', hi: 'Battle of Plassey — 1757' },
        { en: 'Mir Jafar\'s forces did not decisively support the Nawab', hi: 'Mir Jafar की forces ने निर्णायक रूप से Nawab का साथ नहीं दिया' },
        { en: 'Company won the battle', hi: 'Company की विजय हुई' },
        { en: 'Mir Jafar was installed as Nawab', hi: 'Mir Jafar को Bengal का Nawab बनाया गया' },
      ],
      facts: [
        { label: { en: 'Year', hi: 'Year' }, value: { en: '1757', hi: '1757' } },
        { label: { en: 'Nawab', hi: 'Nawab' }, value: { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' } },
        { label: { en: 'Company commander', hi: 'Company commander' }, value: { en: 'Robert Clive', hi: 'Robert Clive' } },
        { label: { en: 'Conspiracy-linked claimant', hi: 'Conspiracy-linked claimant' }, value: { en: 'Mir Jafar', hi: 'Mir Jafar' } },
        { label: { en: 'Forces arrived from', hi: 'Forces arrived from' }, value: { en: 'Madras Presidency', hi: 'Madras Presidency' } },
        { label: { en: 'Early target', hi: 'Early target' }, value: { en: 'Kassimbazar factory', hi: 'Kassimbazar factory' } },
        { label: { en: 'Result', hi: 'Result' }, value: { en: 'Company\'s grip on Bengal politics increased', hi: 'Company की Bengal politics पर पकड़ बढ़ी' } },
      ],
      takeaway: {
        en: 'Plassey did not instantly make the Company ruler of all India, but opened the path to political influence and indirect control in Bengal.',
        hi: 'Plassey ने Company को तुरंत पूरे भारत का शासक नहीं बनाया, लेकिन Bengal में political influence और indirect control का रास्ता खोल दिया।',
      },
      trap: {
        wrong: { en: 'Crown Rule began immediately after Plassey.', hi: 'Plassey के तुरंत बाद Crown Rule शुरू हो गया।' },
        correct: { en: 'Company\'s political power grew; Crown Rule began in 1858.', hi: 'Company की political power बढ़ी; Crown Rule 1858 में शुरू हुआ।' },
      },
    },

    mirJafarQasim: {
      headerSubtitle: {
        en: 'The story of Bengal\'s power and the Company\'s growing interference',
        hi: 'Bengal की सत्ता और Company के बढ़ते हस्तक्षेप की कहानी',
      },
      chronology: [
        {
          name: { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' },
          period: '1756–1757',
          text: { en: 'Last independent Nawab before Plassey; conflict with the Company escalated.', hi: 'Plassey से पहले का अंतिम स्वतंत्र Nawab; Company से conflict तेज़ हुआ।' },
          scene: 'sirajuddaulah' as const,
        },
        {
          name: { en: 'Mir Jafar (first reign)', hi: 'Mir Jafar (पहला कार्यकाल)' },
          period: '1757–1760',
          text: { en: 'Installed as Nawab with Company support after Plassey.', hi: 'Plassey के बाद Company support से Nawab बनाया गया।' },
          scene: 'mir-jafar' as const,
        },
        {
          name: { en: 'Mir Qasim', hi: 'Mir Qasim' },
          period: '1760–1763',
          text: { en: 'Replaced Mir Jafar; attempted administrative and military reforms.', hi: 'Mir Jafar को replace किया; administrative और military reforms का प्रयास।' },
          scene: 'mir-qasim' as const,
        },
        {
          name: { en: 'Company–Mir Qasim conflict', hi: 'Company–Mir Qasim conflict' },
          period: '1763–1764',
          text: { en: 'Disputes over trade privileges and revenue led to war; Mir Qasim fled toward Awadh.', hi: 'Trade privileges और revenue पर विवाद से युद्ध; Mir Qasim Awadh की ओर भागा।' },
          scene: 'conflict' as const,
        },
        {
          name: { en: 'Mir Jafar restored', hi: 'Mir Jafar की पुनर्स्थापना' },
          period: '1763–1765',
          text: { en: 'Restored as Nawab in 1763; remained until 1765 under heavy Company influence.', hi: '1763 में Nawab के रूप में पुनर्स्थापित; 1765 तक Company influence के अधीन रहा।' },
          scene: 'mir-jafar' as const,
        },
      ],
      succession: [
        { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' },
        { en: 'Mir Jafar', hi: 'Mir Jafar' },
        { en: 'Mir Qasim', hi: 'Mir Qasim' },
        { en: 'Conflict with Company', hi: 'Conflict with Company' },
        { en: 'Mir Jafar restored', hi: 'Mir Jafar restored' },
      ],
      mirJafar: {
        title: { en: 'Mir Jafar (1757–1760, again 1763–1765)', hi: 'Mir Jafar (1757–1760, पुनः 1763–1765)' },
        points: [
          { en: 'Key figure in the conspiracy linked to Plassey', hi: 'Plassey से जुड़े conspiracy का प्रमुख व्यक्ति' },
          { en: 'Installed as Nawab with Company backing after the battle', hi: 'युद्ध के बाद Company backing से Nawab बनाया गया' },
          { en: 'Large payments and gifts to the Company where verified', hi: 'Company को बड़े payments और gifts (जहाँ verified)' },
          { en: 'Removed in 1760 when he could not meet Company demands', hi: '1760 में हटाया गया जब Company demands पूरी नहीं कर सका' },
          { en: 'Restored in 1763; remained Nawab until 1765', hi: '1763 में पुनर्स्थापित; 1765 तक Nawab रहा' },
        ],
      },
      mirQasim: {
        title: { en: 'Mir Qasim (1760–1763)', hi: 'Mir Qasim (1760–1763)' },
        points: [
          { en: 'Attempted to strengthen administration and military', hi: 'Administration और military को मजबूत करने का प्रयास' },
          { en: 'Opposed misuse of trade privileges by Company servants', hi: 'Company servants द्वारा trade privileges के misuse का विरोध' },
          { en: 'Revenue and customs disputes with the Company grew', hi: 'Company के साथ revenue और customs disputes बढ़े' },
          { en: 'War with the Company; fled toward Awadh after defeat', hi: 'Company से युद्ध; पराजय के बाद Awadh की ओर' },
          { en: 'Later joined the alliance that led to the Battle of Buxar (1764)', hi: 'बाद में Buxar (1764) की ओर ले जाने वाले alliance में शामिल' },
        ],
      },
      takeaway: {
        en: 'In this period the Company deepened its interference in Bengal\'s succession politics and administration — paving the way toward Buxar and the Diwani grant.',
        hi: 'इस अवधि में Company ने Bengal की succession politics और प्रशासन में अपना हस्तक्षेप गहरा किया; आगे यही प्रक्रिया Battle of Buxar और Diwani अधिकार की पृष्ठभूमि बनी।',
      },
    },

    buxar: {
      sectionLabel: { en: '7A', hi: '7A' },
      headerSubtitle: {
        en: 'It became a decisive turning point in the expansion of the Company\'s military and political power.',
        hi: 'यह युद्ध Company की सैन्य और राजनीतिक शक्ति के विस्तार में एक निर्णायक मोड़ बना।',
      },
      dateLabel: { en: 'Date of battle', hi: 'युद्ध की तारीख' },
      date: { en: '22 October 1764', hi: '22 October 1764' },
      alliance: {
        heading: { en: 'Tripartite Alliance', hi: 'त्रिपक्षीय गठबंधन (Alliance)' },
        intro: {
          en: 'These three forces formed the coalition that opposed the East India Company at Buxar.',
          hi: 'ये तीन शक्तियाँ Buxar में East India Company का विरोध करने वाले गठबंधन का हिस्सा बनीं।',
        },
        members: [
          {
            name: { en: 'Mir Qasim', hi: 'Mir Qasim' },
            role: { en: 'Former Nawab of Bengal', hi: 'Bengal के पूर्व Nawab' },
            accent: 'purple' as const,
          },
          {
            name: { en: 'Shuja-ud-Daula', hi: 'Shuja-ud-Daula' },
            role: { en: 'Nawab of Awadh', hi: 'Awadh के Nawab' },
            accent: 'gold' as const,
          },
          {
            name: { en: 'Shah Alam II', hi: 'Shah Alam II' },
            role: { en: 'Mughal Emperor', hi: 'Mughal Emperor' },
            accent: 'green' as const,
          },
        ],
      },
      comparison: {
        heading: { en: 'Plassey (1757) vs Buxar (1764)', hi: 'प्लासी (1757) बनाम बक्सर (1764)' },
        plasseyTitle: { en: 'Battle of Plassey (1757)', hi: 'प्लासी का युद्ध (1757)' },
        buxarTitle: { en: 'Battle of Buxar (1764)', hi: 'बक्सर का युद्ध (1764)' },
        rows: [
          {
            category: { en: 'Context', hi: 'संदर्भ' },
            plassey: { en: 'Bengal succession struggle', hi: 'Bengal की succession struggle' },
            buxar: { en: 'Broader north-Indian coalition against the Company', hi: 'Company के विरुद्ध व्यापक उत्तर-भारतीय गठबंधन' },
          },
          {
            category: { en: 'Principal opponents', hi: 'मुख्य प्रतिद्वंद्वी' },
            plassey: { en: 'Sirajuddaulah vs the Company', hi: 'Sirajuddaulah बनाम Company' },
            buxar: { en: 'Mir Qasim, Shuja-ud-Daula and Shah Alam II vs the Company', hi: 'Mir Qasim, Shuja-ud-Daula और Shah Alam II बनाम Company' },
          },
          {
            category: { en: 'Nature of contest', hi: 'संघर्ष का स्वरूप' },
            plassey: { en: 'Shaped strongly by conspiracy and non-participation of key commanders', hi: 'Conspiracy और key commanders की अनुपस्थिति से प्रभावित' },
            buxar: { en: 'More substantial military contest', hi: 'अधिक व्यापक सैन्य संघर्ष' },
          },
          {
            category: { en: 'Immediate result', hi: 'तत्काल परिणाम' },
            plassey: { en: 'Mir Jafar installed; Company influence in Bengal politics expanded', hi: 'Mir Jafar स्थापित; Bengal politics में Company influence बढ़ा' },
            buxar: { en: 'Company victory over the combined alliance', hi: 'Combined alliance पर Company की विजय' },
          },
          {
            category: { en: 'Political significance', hi: 'राजनीतिक महत्व' },
            plassey: { en: 'Opened decisive Company interference in Bengal succession', hi: 'Bengal succession में Company हस्तक्षेप का रास्ता खुला' },
            buxar: { en: 'Strengthened Company power beyond the immediate Bengal struggle', hi: 'तत्काल Bengal struggle से आगे Company power मजबूत' },
          },
          {
            category: { en: 'Later consequence', hi: 'बाद का परिणाम' },
            plassey: { en: 'Did not grant Diwani or complete control', hi: 'Diwani या complete control नहीं मिला' },
            buxar: { en: 'Paved the way for the 1765 settlements and Diwani grant', hi: '1765 settlements और Diwani grant की पृष्ठभूमि तैयार' },
          },
        ],
      },
      opposing: { en: 'East India Company', hi: 'East India Company' },
      significance: [
        { en: 'Buxar victory', hi: 'Buxar victory' },
        { en: 'Pressure on Mughal Emperor', hi: 'Mughal Emperor पर Company का दबाव' },
        { en: 'Awadh settlement', hi: 'Awadh settlement' },
        { en: 'Diwani grant (later settlement)', hi: 'Diwani grant' },
        { en: 'Company\'s territorial and financial power strengthened', hi: 'Company की territorial और financial power मजबूत' },
      ],
      compare: {
        plassey: {
          title: { en: 'Plassey', hi: 'Plassey' },
          points: [
            { en: 'Bengal politics', hi: 'Bengal politics' },
            { en: 'Conspiracy and succession', hi: 'Conspiracy and succession' },
            { en: '1757', hi: '1757' },
          ],
        },
        buxar: {
          title: { en: 'Buxar', hi: 'Buxar' },
          points: [
            { en: 'Wider political alliance', hi: 'Wider political alliance' },
            { en: 'Decisive military victory', hi: 'Decisive military victory' },
            { en: '1764', hi: '1764' },
            { en: 'Settlement leading to Diwani', hi: 'Settlement leading to Diwani' },
          ],
        },
      },
      conclusion: {
        en: 'The Buxar victory strengthened the Company\'s military position and prepared the ground for the 1765 political settlements and Diwani rights.',
        hi: 'Buxar की विजय ने Company की सैन्य स्थिति को मजबूत किया और 1765 के राजनीतिक समझौतों तथा Diwani अधिकार की पृष्ठभूमि तैयार की।',
      },
      takeaway: {
        en: 'Plassey opened the path; Buxar strengthened the Company\'s position and made formal settlement possible.',
        hi: 'Plassey ने रास्ता खोला; Buxar ने Company की स्थिति मजबूत और वैधानिक settlement के योग्य बनाई।',
      },
    },

    allahabadDiwani: {
      sectionLabel: { en: '7B', hi: '7B' },
      headerSubtitle: {
        en: 'The 1765 arrangements after Buxar gave the Company revenue-collection rights and a new political footing.',
        hi: 'Buxar के बाद 1765 की व्यवस्थाओं ने Company को राजस्व-संग्रह का अधिकार और नया राजनीतिक आधार दिया।',
      },
      mapHeading: { en: 'Main regions (after settlement)', hi: 'मुख्य क्षेत्र (संधि के बाद)' },
      mapNote: {
        en: 'Schematic diagram — not to scale. Shows legal/political status, not exact borders.',
        hi: 'Schematic diagram — not to scale. कानूनी/राजनीतिक स्थिति दर्शाता है, सटीक सीमाएँ नहीं।',
      },
      regionLegend: [
        { name: { en: 'Bengal', hi: 'Bengal' }, status: { en: 'Diwani granted to Company', hi: 'Diwani Company को प्रदान' }, accent: 'purple' as const },
        { name: { en: 'Bihar', hi: 'Bihar' }, status: { en: 'Diwani granted to Company', hi: 'Diwani Company को प्रदान' }, accent: 'purple' as const },
        { name: { en: 'Orissa', hi: 'Orissa' }, status: { en: 'Diwani granted to Company', hi: 'Diwani Company को प्रदान' }, accent: 'purple' as const },
        { name: { en: 'Awadh', hi: 'Awadh' }, status: { en: 'Restored to Shuja-ud-Daula (buffer role)', hi: 'Shuja-ud-Daula को लौटाया (buffer)' }, accent: 'green' as const },
        { name: { en: 'Kara and Allahabad', hi: 'Kora और Allahabad' }, status: { en: 'Assigned to Shah Alam II', hi: 'Shah Alam II को सौंपे गए' }, accent: 'gold' as const },
      ],
      powerFlowHeading: { en: 'From settlement to Diwani — flow of power', hi: 'संधि से Diwani तक — शक्ति का प्रवाह' },
      powerFlow: [
        {
          title: { en: 'Battle of Buxar', hi: 'Buxar का युद्ध' },
          date: { en: '22 October 1764', hi: '22 October 1764' },
          text: { en: 'Decisive military victory for the Company', hi: 'Company की निर्णायक सैन्य विजय' },
          accent: 'purple' as const,
          icon: 'swords' as const,
        },
        {
          title: { en: 'Allahabad arrangements', hi: 'Allahabad की व्यवस्थाएँ' },
          date: { en: 'August 1765', hi: 'August 1765' },
          text: { en: 'Separate treaties/settlements with Shah Alam II and Shuja-ud-Daula', hi: 'Shah Alam II और Shuja-ud-Daula के साथ अलग-अलग treaties/settlements' },
          accent: 'blue' as const,
          icon: 'document' as const,
        },
        {
          title: { en: 'Diwani grant', hi: 'Diwani की प्राप्ति' },
          date: { en: '1765', hi: '1765' },
          text: { en: 'Diwani of Bengal, Bihar and Orissa — revenue administration, not full sovereignty', hi: 'Bengal, Bihar और Orissa की Diwani — revenue administration, पूर्ण sovereignty नहीं' },
          accent: 'green' as const,
          icon: 'institution' as const,
        },
      ],
      resultStrip: {
        en: 'The Company received Diwani — rights over revenue collection and related civil administration; Nizamat and broader governance remained a separate question.',
        hi: 'Company को Diwani अर्थात राजस्व-संग्रह और उससे संबंधित दीवानी प्रशासन का अधिकार मिला; Nizamat तथा व्यापक शासन-व्यवस्था का प्रश्न अलग रहा।',
      },
      cards: [
        {
          title: { en: 'Shah Alam II granted Diwani', hi: 'Shah Alam II ने Diwani प्रदान की' },
          text: { en: 'The Mughal Emperor granted the Company Diwani rights over Bengal, Bihar and Orissa — revenue administration, not complete sovereignty.', hi: 'Mughal Emperor ने Company को Bengal, Bihar और Orissa की Diwani दी — revenue administration, complete sovereignty नहीं।' },
          accent: 'purple' as const,
          icon: 'crown' as const,
        },
        {
          title: { en: 'Annual payment: ₹26 lakh', hi: 'वार्षिक भुगतान: 26 लाख रुपये' },
          text: { en: 'The Company agreed to pay Shah Alam II ₹26 lakh annually under the settlement.', hi: 'Settlement के अंतर्गत Company ने Shah Alam II को वार्षिक 26 लाख रुपये देने की व्यवस्था स्वीकार की।' },
          accent: 'gold' as const,
          icon: 'coins' as const,
        },
        {
          title: { en: 'Kara and Allahabad to Shah Alam II', hi: 'Kora और Allahabad Shah Alam II को' },
          text: { en: 'Kara and Allahabad were assigned to Shah Alam II — not transferred to the Company as ordinary territory.', hi: 'Kora और Allahabad Shah Alam II को सौंपे गए — Company के साधारण territory के रूप में transfer नहीं।' },
          accent: 'blue' as const,
          icon: 'landmark' as const,
        },
        {
          title: { en: 'Awadh restored to Shuja-ud-Daula', hi: 'Awadh Shuja-ud-Daula को लौटाया गया' },
          text: { en: 'Awadh was restored to Shuja-ud-Daula subject to treaty conditions and served as a buffer in Company strategy.', hi: 'Awadh Shuja-ud-Daula को treaty conditions के अधीन लौटाया गया; Company strategy में buffer के रूप में रहा।' },
          accent: 'green' as const,
          icon: 'shield' as const,
        },
      ],
      flow: [
        { en: 'Battle of Buxar', hi: 'Battle of Buxar' },
        { en: 'Political negotiation', hi: 'Political negotiation' },
        { en: 'Treaty of Allahabad', hi: 'Treaty of Allahabad' },
        { en: 'Diwani of Bengal, Bihar and Orissa', hi: 'Diwani of Bengal, Bihar and Orissa' },
        { en: 'Revenue-based Company government', hi: 'Revenue-based Company government' },
      ],
      takeaway: {
        en: 'The 1765 settlement gave the Company a formal basis for Bengal\'s revenue.',
        hi: '1765 के settlement ने Company को Bengal के revenue का औपचारिक आधार दिया।',
      },
    },

    politicalPower: {
      sectionLabel: { en: '8', hi: '8' },
      flagline: { en: 'East India Company power journey', hi: 'East India Company की शक्ति यात्रा' },
      chronology: [
        {
          year: '1600',
          icon: 'ship' as const,
          title: { en: 'Commercial Charter', hi: 'Commercial Charter' },
          text: { en: 'Royal charter granted trading rights and Company incorporation — not political sovereignty.', hi: 'Royal charter से trading rights और Company incorporation — political sovereignty नहीं।' },
        },
        {
          year: '1651',
          icon: 'factory' as const,
          title: { en: 'Bengal Factory', hi: 'Bengal Factory' },
          text: { en: 'English factory established on the Hugli river in Bengal.', hi: 'Bengal में Hugli नदी के किनारे English factory स्थापित।' },
        },
        {
          year: '1696',
          icon: 'fort' as const,
          title: { en: 'Fortification', hi: 'Fortification' },
          text: { en: 'Company began fortifying/strengthening its Bengal settlements.', hi: 'Company ने Bengal settlements की fortification/मजबूती शुरू की।' },
        },
        {
          year: '1757',
          icon: 'swords' as const,
          title: { en: 'Battle of Plassey', hi: 'Battle of Plassey' },
          text: { en: 'Expanded Company influence in Bengal politics — not instant full territorial rule.', hi: 'Bengal politics में Company influence बढ़ा — तुरंत पूर्ण territorial rule नहीं।' },
        },
        {
          year: '1764',
          icon: 'shield' as const,
          title: { en: 'Battle of Buxar', hi: 'Battle of Buxar' },
          text: { en: 'Victory over Mir Qasim, Shuja-ud-Daula and Shah Alam II (22 October 1764).', hi: 'Mir Qasim, Shuja-ud-Daula और Shah Alam II पर विजय (22 October 1764)।' },
        },
        {
          year: '1765',
          icon: 'document' as const,
          title: { en: 'Diwani Rights', hi: 'Diwani Rights' },
          text: { en: 'Shah Alam II granted Diwani over Bengal, Bihar and Orissa — revenue administration, not full sovereignty.', hi: 'Shah Alam II ने Bengal, Bihar और Orissa की Diwani दी — revenue administration, पूर्ण sovereignty नहीं।' },
        },
        {
          year: 'After 1765',
          icon: 'institution' as const,
          title: { en: 'Dual Government', hi: 'Dual Government' },
          text: { en: 'Diwani with the Company; Nizamat formally with the Nawab under reduced effective autonomy.', hi: 'Diwani Company के पास; Nizamat औपचारिक रूप से Nawab के पास — प्रभावी autonomy सीमित।' },
        },
      ],
      memory: {
        en: 'Trade Post → Fortified Settlement → Political Influence → Military Victory → Revenue Power',
        hi: 'Trade Post → Fortified Settlement → Political Influence → Military Victory → Revenue Power',
      },
      note: {
        en: 'After 1757 the Company grew powerful, but direct British Crown rule did not begin immediately — it began in 1858.',
        hi: '1757 के बाद Company शक्तिशाली हुई, लेकिन British Crown का प्रत्यक्ष शासन तुरंत शुरू नहीं हुआ — 1858 में शुरू हुआ।',
      },
      takeaway: { en: 'A commercial body gradually became a political and revenue power.', hi: 'Commercial body धीरे-धीरे political और revenue power बनी।' },
    },

    diwani: {
      panelHeading: { en: 'What was Diwani?', hi: 'Diwani क्या थी?' },
      panelSubtitle: {
        en: 'Rights related to revenue collection and Diwani administration',
        hi: 'राजस्व वसूली और दीवानी प्रशासन से संबंधित अधिकार',
      },
      summaryHeading: { en: 'Diwani = Revenue Administration', hi: 'Diwani = Revenue Administration' },
      summaryText: {
        en: 'Diwani gave the Company rights to collect revenue and related civil/revenue administration in Bengal, Bihar and Orissa.',
        hi: 'Diwani से Company को Bengal, Bihar और Orissa/Odisha में राजस्व एकत्र करने तथा उससे जुड़े दीवानी प्रशासन का अधिकार मिला।',
      },
      subtitle: { en: 'The turning point of revenue power', hi: 'Revenue power का turning point' },
      mainPoints: [
        { en: 'Control over revenue collection', hi: 'राजस्व-संग्रह का नियंत्रण' },
        { en: 'Related to civil justice — not criminal justice', hi: 'Civil justice से संबंध — criminal justice नहीं' },
        { en: 'Bengal revenue used for trade and army', hi: 'बंगाल के राजस्व का उपयोग व्यापार और सेना के लिए' },
        { en: 'Permanent financial base for administration', hi: 'प्रशासन के लिए स्थायी financial base' },
      ],
      statCards: [
        { label: { en: 'Granted By', hi: 'Granted By' }, value: { en: 'Mughal Emperor Shah Alam II', hi: 'Mughal Emperor Shah Alam II' }, accent: 'purple' as const, icon: 'crown' as const },
        { label: { en: 'Year', hi: 'Year' }, value: { en: '1765', hi: '1765' }, accent: 'green' as const, icon: 'calendar' as const },
        { label: { en: 'Areas', hi: 'Areas' }, value: { en: 'Bengal, Bihar & Orissa', hi: 'Bengal, Bihar & Orissa' }, accent: 'orange' as const, icon: 'map' as const },
        { label: { en: 'Annual Payment', hi: 'Annual Payment' }, value: { en: '26 Lakh Rupees', hi: '26 Lakh Rupees' }, accent: 'blue' as const, icon: 'coins' as const },
      ],
      factStrip: [
        { label: { en: 'Granted by', hi: 'Granted by' }, value: { en: 'Shah Alam II', hi: 'Shah Alam II' } },
        { label: { en: 'Year', hi: 'Year' }, value: { en: '1765', hi: '1765' } },
        { label: { en: 'Areas', hi: 'Areas' }, value: { en: 'Bengal, Bihar and Orissa', hi: 'Bengal, Bihar and Orissa' } },
        { label: { en: 'Annual payment', hi: 'Annual payment' }, value: { en: '₹26 lakh to Shah Alam II', hi: '₹26 lakh to Shah Alam II' } },
      ],
      miniCards: [
        { en: 'Goods Purchase', hi: 'Goods Purchase' },
        { en: 'Troop Maintenance', hi: 'Troops Maintain' },
        { en: 'Administrative Expenses', hi: 'Administrative Expenses' },
      ],
      causeEffect: [
        { en: 'Governance needs money', hi: 'शासन के लिए पैसा चाहिए' },
        { en: 'Diwani provided revenue source', hi: 'Diwani ने revenue source दिया' },
        { en: 'Company power increased', hi: 'Company की शक्ति बढ़ी' },
      ],
      takeaway: { en: 'Diwani gave the Company both money and power.', hi: 'Diwani ने Company को पैसा और power दोनों दिए।' },
    },

    diwaniNizamat: {
      compareHeading: { en: 'Diwani vs Nizamat', hi: 'Diwani vs Nizamat' },
      mnemonicHeading: { en: 'Memory Trick', hi: 'याद रखने की Trick' },
      subtitle: { en: 'The difference in simple language', hi: 'दोनों का अंतर आसान भाषा में' },
      diwani: {
        title: { en: 'Diwani (दीवानी)', hi: 'Diwani (दीवानी)' },
        points: [
          { en: 'Revenue administration', hi: 'Revenue administration' },
          { en: 'Civil justice', hi: 'Civil justice' },
          { en: 'Money and finance', hi: 'Money and finance' },
          { en: 'Company\'s financial strength', hi: 'Company की financial strength' },
        ],
      },
      nizamat: {
        title: { en: 'Nizamat (निजामत)', hi: 'Nizamat (निजामत)' },
        points: [
          { en: 'Law and order', hi: 'Law and order' },
          { en: 'Criminal justice', hi: 'Criminal justice' },
          { en: 'Police and control', hi: 'Police and control' },
          { en: 'Formal administrative responsibility', hi: 'Formal administrative responsibility' },
        ],
      },
      mnemonic: {
        d: {
          main: { en: 'D = Diwani = धन', hi: 'D = Diwani = धन' },
          support: { en: 'Wealth — Revenue, Income, Collection', hi: 'धन यानी Revenue, Income, Collection' },
        },
        n: {
          main: { en: 'N = Nizamat = नियम', hi: 'N = Nizamat = नियम' },
          support: { en: 'Rule — Law & Order, Security, Justice', hi: 'नियम यानी Law & Order, Security, Justice' },
        },
        strip: { en: 'Wealth comes from D; rules come from N.', hi: 'D से धन आता है, N से नियम चलता है।' },
        note: {
          en: 'This is a simple memory aid; see the comparison table for full definitions.',
          hi: 'यह केवल याद रखने की सरल Trick है; विस्तृत अर्थ तुलना तालिका में देखें।',
        },
      },
      trap: { en: 'Exam Trap: Do not link Diwani with criminal justice.', hi: 'Exam Trap: Diwani को criminal justice से न जोड़ें।' },
      chips: ['Revenue', 'Civil Justice', 'Law & Order', 'Responsibility'],
      compareRows: [
        {
          topic: { en: 'Meaning', hi: 'अर्थ' },
          diwani: { en: 'Revenue collection and related civil/revenue administration', hi: 'राजस्व वसूली और संबंधित civil/revenue administration' },
          nizamat: { en: 'Criminal justice, policing, public order and related executive responsibility', hi: 'Criminal justice, policing, public order और संबंधित executive responsibility' },
        },
        {
          topic: { en: 'Who held it?', hi: 'किसके पास?' },
          diwani: { en: 'East India Company after the 1765 grant', hi: '1765 grant के बाद East India Company' },
          nizamat: { en: 'Formally the Nawab under Dual Government; effective Company influence grew', hi: 'Dual Government में औपचारिक रूप से Nawab; प्रभावी Company influence बढ़ा' },
        },
        {
          topic: { en: 'Key task', hi: 'प्रमुख कार्य' },
          diwani: { en: 'Revenue collection and related functions', hi: 'Revenue collection और संबंधित functions' },
          nizamat: { en: 'Policing, public order, criminal justice and administration', hi: 'Policing, public order, criminal justice और administration' },
        },
        {
          topic: { en: 'Practical power/benefit', hi: 'वास्तविक लाभ/शक्ति' },
          diwani: { en: 'Company gained access to Bengal\'s revenue resources', hi: 'Company को Bengal के revenue resources तक पहुँच मिली' },
          nizamat: { en: 'Nawab retained formal responsibility with restricted resources and reduced effective autonomy', hi: 'Nawab ने औपचारिक जिम्मेदारी रखी — संसाधन सीमित, प्रभावी autonomy कम' },
        },
      ],
    },

    dualGovernment: {
      period: { en: '(1765–1772)', hi: '(1765–1772)' },
      intro: {
        en: 'State functions were split so powers and resources rested in different hands — not two equal governments.',
        hi: 'राज्य के कार्य विभाजित किए गए जहाँ शक्तियाँ और संसाधन अलग-अलग हाथों में थे — दो बराबर governments नहीं।',
      },
      company: {
        title: { en: 'With the Company', hi: 'Company के पास' },
        points: [
          { en: 'Diwani and revenue control', hi: 'Diwani और revenue control' },
          { en: 'Financial resources', hi: 'Financial resources' },
          { en: 'Nomination and supervision of deputies', hi: 'Nomination and supervision of deputies' },
          { en: 'Effective control', hi: 'Effective control' },
        ],
      },
      nawab: {
        title: { en: 'With the Nawab', hi: 'Nawab के पास' },
        points: [
          { en: 'Nizamat in formal terms', hi: 'Nizamat in formal terms' },
          { en: 'Law and order responsibility', hi: 'Law and order responsibility' },
          { en: 'Criminal justice responsibility', hi: 'Criminal justice responsibility' },
          { en: 'Public accountability — but inadequate resources', hi: 'Public accountability — inadequate financial resources' },
        ],
      },
      statements: [
        { en: 'Power without responsibility — Company', hi: 'Power without responsibility — Company' },
        { en: 'Responsibility without resources — Nawab', hi: 'Responsibility without resources — Nawab' },
      ],
      takeaway: {
        en: 'Dual Government meant effective power with the Company and formal responsibility with the Nawab — not equal governments.',
        hi: 'Dual Government का अर्थ effective power Company के पास और formal responsibility Nawab के पास — बराबर governments नहीं।',
      },
    },

    muhammadRazaKhan: {
      subtitle: { en: '(Naib Diwan and Naib Nazim)', hi: '(Naib Diwan और Naib Nazim)' },
      flowSteps: [
        {
          title: { en: 'Company Supervision', hi: 'Company Supervision' },
          text: { en: 'Ultimate control remained with the Company.', hi: 'अंतिम नियंत्रण Company के पास रहा।' },
          tone: 'green' as const,
        },
        {
          title: { en: 'Naib Diwan (1765)', hi: 'Naib Diwan (1765)' },
          text: { en: 'Revenue side under Company direction.', hi: 'Company के निर्देशन में revenue पक्ष।' },
          tone: 'purple' as const,
        },
        {
          title: { en: 'Naib Nazim (1765)', hi: 'Naib Nazim (1765)' },
          text: { en: 'Formal Nizamat side under the same arrangement.', hi: 'उसी व्यवस्था में formal Nizamat पक्ष।' },
          tone: 'orange' as const,
        },
        {
          title: { en: 'Nawab (Nominal Head)', hi: 'Nawab (Nominal Head)' },
          text: { en: 'Nominal head with formal responsibility.', hi: 'Nominal head — formal responsibility के साथ।' },
          tone: 'blue' as const,
        },
      ],
      relationship: {
        en: 'Dual responsibility, but resources under Company control',
        hi: 'दोहरी ज़िम्मेदारी, लेकिन संसाधन Company के नियंत्रण में',
      },
      intro: {
        en: 'Muhammad Raza Khan gained an important place in indirect administration through Naib Diwan and Naib Nazim roles, working under Company supervision.',
        hi: 'Muhammad Raza Khan ने Naib Diwan और Naib Nazim की भूमिकाओं के माध्यम से indirect administration में महत्वपूर्ण स्थान प्राप्त किया। वह Company के supervision में कार्य करता था।',
      },
      diagram: {
        companySide: [
          { en: 'Company', hi: 'Company' },
          { en: 'Supervision', hi: 'Supervision' },
          { en: 'Muhammad Raza Khan', hi: 'Muhammad Raza Khan' },
          { en: 'Naib Diwan role', hi: 'Naib Diwan role' },
        ],
        nawabSide: [
          { en: 'Nawab', hi: 'Nawab' },
          { en: 'Formal Nizamat side', hi: 'Formal Nizamat side' },
          { en: 'Muhammad Raza Khan', hi: 'Muhammad Raza Khan' },
          { en: 'Naib Nazim role', hi: 'Naib Nazim role' },
        ],
      },
    },

    constitutionalProblem: {
      steps: [
        { title: { en: 'Private Company', hi: 'Private Company' }, text: { en: 'A commercial body was running government', hi: 'व्यापारिक संस्था शासन चला रही थी' } },
        { title: { en: 'Public Powers', hi: 'Public Powers' }, text: { en: 'Revenue + Military + Government', hi: 'Revenue + Military + Government' } },
        { title: { en: 'Need for Accountability', hi: 'Accountability की जरूरत' }, text: { en: 'Public control and parliamentary supervision became necessary', hi: 'Public control और parliamentary supervision आवश्यक हुआ' } },
      ],
      highlight: {
        en: 'Government power + private interest + weak accountability = Constitutional Problem',
        hi: 'सरकारी शक्ति + निजी हित + कमजोर जवाबदेही = Constitutional Problem',
      },
      takeaway: {
        en: 'This is why the British Parliament felt the need to control the Company.',
        hi: 'इसी कारण British Parliament ने Company पर नियंत्रण की आवश्यकता महसूस की।',
      },
      nextTopic: { en: 'Next Topic: Regulating Act 1773', hi: 'अगला Topic: Regulating Act 1773' },
    },

    governanceSection: {
      conclusion: {
        en: 'Dual Government placed effective power with the Company and formal responsibility with the Nawab — not equal governments. This constitutional gap is why parliamentary control became necessary.',
        hi: 'Dual Government का अर्थ effective power Company के पास और formal responsibility Nawab के पास — बराबर governments नहीं। यही constitutional gap था जिसके कारण parliamentary control आवश्यक हुआ।',
      },
    },

    completeTimeline: {
      sectionLabel: { en: '10', hi: '10' },
      events: [
        {
          year: '1600',
          icon: 'crown' as const,
          accent: '#5B2BE0',
          title: { en: 'Royal Charter', hi: 'Royal Charter' },
          text: {
            en: 'Queen Elizabeth I granted the charter incorporating the East India Company with trading privileges — not territorial sovereignty.',
            hi: 'Queen Elizabeth I ने trading privileges के साथ Company को incorporate किया — territorial sovereignty नहीं।',
          },
        },
        {
          year: '1651',
          icon: 'factory' as const,
          accent: '#249650',
          title: { en: 'Hugli Factory', hi: 'Hugli Factory' },
          text: {
            en: 'Trading establishment (factory) on the Hugli river in Bengal — not a modern manufacturing plant.',
            hi: 'Bengal में Hugli पर trading establishment (factory) — manufacturing plant नहीं।',
          },
        },
        {
          year: '1757',
          icon: 'swords' as const,
          accent: '#2474D8',
          title: { en: 'Battle of Plassey', hi: 'Battle of Plassey' },
          text: {
            en: 'Major expansion of Company influence in Bengal politics — not instant full territorial government.',
            hi: 'Bengal politics में Company influence बढ़ा — तुरंत पूर्ण territorial government नहीं।',
          },
        },
        {
          year: '1764',
          icon: 'fort' as const,
          accent: '#F1841D',
          title: { en: 'Battle of Buxar', hi: 'Battle of Buxar' },
          text: {
            en: 'Victory over Mir Qasim, Shuja-ud-Daula and Shah Alam II (22 October 1764).',
            hi: 'Mir Qasim, Shuja-ud-Daula और Shah Alam II पर विजय (22 October 1764)।',
          },
        },
        {
          year: '1765',
          icon: 'document' as const,
          accent: '#6E35E8',
          title: { en: 'Allahabad & Diwani', hi: 'Allahabad & Diwani' },
          text: {
            en: 'Post-Buxar Allahabad arrangements; Shah Alam II granted Diwani over Bengal, Bihar and Orissa.',
            hi: 'Buxar के बाद Allahabad arrangements; Shah Alam II ने Bengal, Bihar और Orissa की Diwani दी।',
          },
        },
        {
          year: '1773',
          icon: 'governance' as const,
          accent: '#249650',
          title: { en: 'Regulating Act 1773', hi: 'Regulating Act 1773' },
          text: {
            en: 'First major Act bringing the Company under parliamentary regulation and stronger state oversight.',
            hi: 'Company पर parliamentary regulation और stronger state oversight — पहला major Act।',
          },
        },
        {
          year: '1784',
          icon: 'shield' as const,
          accent: '#2474D8',
          title: { en: 'Pitt\'s India Act', hi: 'Pitt\'s India Act' },
          text: {
            en: 'Dual control via Board of Control — distinct from Bengal\'s Dual Government (1765–1772).',
            hi: 'Board of Control के साथ dual control — Bengal Dual Government (1765–1772) से अलग।',
          },
        },
        {
          year: '1833+',
          icon: 'scales' as const,
          accent: '#E23843',
          title: { en: 'Later Charter Acts', hi: 'Later Charter Acts' },
          text: {
            en: 'Successive Charter Acts strengthened parliamentary and central legislative control over the Company.',
            hi: 'क्रमिक Charter Acts ने Company पर parliamentary/central legislative control मजबूत किया।',
          },
        },
      ],
      summary: {
        en: 'From trade charter to revenue power, then toward parliamentary regulation and control.',
        hi: 'Trade charter से revenue power, फिर parliamentary regulation और control की ओर।',
      },
    },

    examTraps: {
      dontMistakeHeading: { en: "Don't Mistake", hi: 'गलती मत करना' },
      smartPointsHeading: { en: 'Exam Smart Points', hi: 'परीक्षा के स्मार्ट पॉइंट्स' },
      dontMistake: [
        {
          en: 'Diwani Grant = Full Political Sovereignty',
          hi: 'Diwani Grant = Full Political Sovereignty',
          correction: {
            en: 'Diwani mainly concerned revenue and related civil administration — not complete sovereignty.',
            hi: 'Diwani मुख्य रूप से revenue और related civil administration से जुड़ी थी — complete sovereignty नहीं।',
          },
        },
        {
          en: 'Treaty of Allahabad = Battle of Buxar',
          hi: 'Treaty of Allahabad = Battle of Buxar',
          correction: {
            en: 'Buxar was fought in 1764; the Allahabad arrangements followed in 1765.',
            hi: 'Buxar 1764 में लड़ी गई; Allahabad arrangements 1765 में हुए।',
          },
        },
        {
          en: 'Company Servant = Crown Official',
          hi: 'Company Servant = Crown Official',
          correction: {
            en: 'Company servants were employees of the East India Company, not automatically Crown officials.',
            hi: 'Company servants East India Company के employees थे — automatically Crown officials नहीं।',
          },
        },
        {
          en: 'Regulating Act 1773 = Pitt\'s India Act 1784',
          hi: 'Regulating Act 1773 = Pitt\'s India Act 1784',
          correction: {
            en: 'Separate Acts with different institutional arrangements.',
            hi: 'अलग Acts — different institutional arrangements।',
          },
        },
      ],
      examSmartPoints: [
        {
          en: 'Diwani = Revenue-related authority',
          hi: 'Diwani = Revenue-related authority',
        },
        {
          en: 'Bengal Dual Government = Company\'s Diwani + Nawab\'s formal Nizamat under growing Company dominance',
          hi: 'Bengal Dual Government = Company की Diwani + Nawab की formal Nizamat — Company dominance बढ़ती रही',
        },
        {
          en: 'Parliamentary control developed through successive Acts',
          hi: 'Parliamentary control successive Acts के माध्यम से विकसित हुआ',
        },
        {
          en: 'Charter renewal increasingly brought the Company under state/parliamentary supervision',
          hi: 'Charter renewal से Company state/parliamentary supervision के अंतर्गत आती गई',
        },
      ],
      booster: { en: 'Spot the wrong line, remember the correct concept.', hi: 'गलत line पहचानो, सही concept याद रखो।' },
    },

    mindmap: {
      center: {
        lines: [
          { en: 'From Charter', hi: 'Charter से' },
          { en: 'to Parliamentary', hi: 'Parliamentary' },
          { en: 'Control', hi: 'Control तक' },
        ],
      },
      leftNodes: [
        { id: 'charter', label: { en: 'Company Charter', hi: 'चार्टर प्राप्ति' }, color: '#5B2BE0' },
        { id: 'trade', label: { en: 'Early Trade & Expansion', hi: 'प्रारंभिक व्यापार एवं विस्तार' }, color: '#249650' },
        { id: 'power', label: { en: 'Territorial/Political Power', hi: 'राजनीतिक-क्षेत्रीय शक्ति' }, color: '#2474D8' },
        { id: 'revenue', label: { en: 'Revenue Rights', hi: 'राजस्व अधिकार' }, color: '#F1841D' },
      ],
      rightNodes: [
        { id: 'admin', label: { en: 'Administration & Reforms', hi: 'प्रशासनिक सुधार' }, color: '#6E35E8' },
        { id: 'acts', label: { en: 'Regulation Acts', hi: 'नियामक अधिनियम' }, color: '#249650' },
        { id: 'parliament', label: { en: 'Parliamentary Oversight', hi: 'संसदीय निगरानी' }, color: '#2474D8' },
        { id: 'accountability', label: { en: 'Accountability & Control', hi: 'जवाबदेही एवं नियंत्रण' }, color: '#E23843' },
      ],
      branches: [
        {
          label: { en: 'Charter 1600', hi: 'Charter 1600' },
          items: [
            { en: 'Queen Elizabeth I', hi: 'Queen Elizabeth I' },
            { en: 'English trade monopoly', hi: 'English trade monopoly' },
            { en: 'No territorial sovereignty', hi: 'No territorial sovereignty' },
          ],
        },
        {
          label: { en: 'Early Bengal Settlements', hi: 'Early Bengal Settlements' },
          items: [
            { en: 'Hugli 1651', hi: 'Hugli 1651' },
            { en: 'Factors', hi: 'Factors' },
            { en: 'Fortification 1696', hi: 'Fortification 1696' },
            { en: 'Three villages & Kalikata', hi: 'Three villages & Kalikata' },
          ],
        },
        {
          label: { en: 'Trade Conflict', hi: 'Trade Conflict' },
          items: [
            { en: 'Duty-free privilege', hi: 'Duty-free privilege' },
            { en: 'Private trade misuse', hi: 'Private trade misuse' },
            { en: 'Revenue loss', hi: 'Revenue loss' },
            { en: 'Conflict with Nawabs', hi: 'Conflict with Nawabs' },
          ],
        },
        {
          label: { en: 'Plassey 1757', hi: 'Plassey 1757' },
          items: [
            { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' },
            { en: 'Robert Clive', hi: 'Robert Clive' },
            { en: 'Mir Jafar', hi: 'Mir Jafar' },
            { en: 'Political influence', hi: 'Political influence' },
          ],
        },
        {
          label: { en: 'Nawab Succession', hi: 'Nawab Succession' },
          items: [
            { en: 'Mir Jafar', hi: 'Mir Jafar' },
            { en: 'Mir Qasim', hi: 'Mir Qasim' },
            { en: 'Conflict', hi: 'Conflict' },
            { en: 'Mir Jafar restored', hi: 'Mir Jafar restored' },
          ],
        },
        {
          label: { en: 'Buxar 1764', hi: 'Buxar 1764' },
          items: [
            { en: 'Mir Qasim', hi: 'Mir Qasim' },
            { en: 'Shuja-ud-Daulah', hi: 'Shuja-ud-Daulah' },
            { en: 'Shah Alam II', hi: 'Shah Alam II' },
          ],
        },
        {
          label: { en: 'Allahabad Settlement', hi: 'Allahabad Settlement' },
          items: [
            { en: 'Diwani 1765', hi: 'Diwani 1765' },
            { en: 'Bengal, Bihar, Orissa', hi: 'Bengal, Bihar, Orissa' },
            { en: '₹26 lakh', hi: '₹26 lakh' },
            { en: 'Kara & Allahabad', hi: 'Kara & Allahabad' },
            { en: 'Awadh buffer', hi: 'Awadh buffer' },
          ],
        },
        {
          label: { en: 'Administration', hi: 'Administration' },
          items: [
            { en: 'Diwani', hi: 'Diwani' },
            { en: 'Nizamat', hi: 'Nizamat' },
            { en: 'Dual Government', hi: 'Dual Government' },
            { en: 'Muhammad Raza Khan', hi: 'Muhammad Raza Khan' },
          ],
        },
        {
          label: { en: 'Constitutional Issue', hi: 'Constitutional Issue' },
          items: [
            { en: 'Private company', hi: 'Private company' },
            { en: 'Public powers', hi: 'Public powers' },
            { en: 'Weak accountability', hi: 'Weak accountability' },
            { en: 'Parliamentary control needed', hi: 'Parliamentary control needed' },
          ],
        },
      ],
      memoryLine: {
        en: 'Charter → Factory → Conflict → Plassey → Buxar → Diwani → Dual Government → Parliamentary Control',
        hi: 'Charter → Factory → Conflict → Plassey → Buxar → Diwani → Dual Government → Parliamentary Control',
      },
      summaryCards: [
        {
          title: { en: 'One-line Revision', hi: 'One-line Revision' },
          text: { en: 'Trade rights first; political and revenue power came later through Bengal.', hi: 'पहले trade rights; Bengal के माध्यम से बाद में political और revenue power।' },
        },
        {
          title: { en: 'Memory Trick', hi: 'Memory Trick' },
          text: { en: 'D = Diwani = Wealth; N = Nizamat = Law & order.', hi: 'D = Diwani = धन; N = Nizamat = नियम।' },
        },
        {
          title: { en: 'Final Takeaway', hi: 'Final Takeaway' },
          text: { en: 'Company rule became unconstitutional — leading to Regulating Act 1773.', hi: 'Company rule असंवैधानिक बनी — Regulating Act 1773 की ओर।' },
        },
      ],
    },
  },

  practice: {
    title: { en: 'Quick Practice', hi: 'Quick Practice' },
    titleHi: { en: 'त्वरित अभ्यास', hi: 'त्वरित अभ्यास' },
    cta: { en: 'Start Quick Practice', hi: 'Start Quick Practice' },
    previewQuestionIndex: 5,
    questions: [
      {
        q: { en: 'Who granted the royal charter to the East India Company in 1600?', hi: '1600 में East India Company को royal charter किसने दिया?' },
        options: [
          { en: 'Queen Elizabeth I', hi: 'Queen Elizabeth I' },
          { en: 'King James I', hi: 'King James I' },
          { en: 'King Charles I', hi: 'King Charles I' },
          { en: 'Queen Victoria', hi: 'Queen Victoria' },
        ],
        correct: 0,
        explanation: { en: 'Queen Elizabeth I granted the charter in 1600 — a direct SSC/UPSC fact.', hi: '1600 में Queen Elizabeth I ने charter दिया — King James I ने नहीं।' },
        sourceId: 'ncert-class8-trade-territory',
      },
      {
        q: { en: 'Where and when was the Company\'s first Bengal factory established?', hi: 'Company की पहली Bengal factory कहाँ और कब स्थापित हुई?' },
        options: [
          { en: 'Hugli river, 1651', hi: 'Hugli नदी, 1651' },
          { en: 'Calcutta, 1696', hi: 'Calcutta, 1696' },
          { en: 'Madras, 1600', hi: 'Madras, 1600' },
          { en: 'Surat, 1651', hi: 'Surat, 1651' },
        ],
        correct: 0,
        explanation: { en: 'The first English factory in Bengal was on the Hugli river in 1651 — not Calcutta.', hi: 'Bengal में पहली English factory 1651 में Hugli नदी के किनारे थी — Calcutta में नहीं।' },
        sourceId: 'ncert-class8-trade-territory',
      },
      {
        q: { en: 'In Company trade, who were called "factors"?', hi: 'Company trade में "factors" किसे कहा जाता था?' },
        options: [
          { en: 'Commercial agents who bought goods and kept accounts', hi: 'व्यापारिक agents जो वस्तुएँ खरीदते और हिसाब रखते थे' },
          { en: 'Military commanders', hi: 'Military commanders' },
          { en: 'Revenue collectors of the Nawab', hi: 'Nawab के revenue collectors' },
          { en: 'British Crown officials', hi: 'British Crown officials' },
        ],
        correct: 0,
        explanation: { en: 'Factors were the Company\'s commercial agents and employees at trading posts.', hi: 'Factors Company के व्यापारिक agents और employees थे।' },
        sourceId: 'ncert-class8-trade-territory',
      },
      {
        q: { en: 'When did the Company begin fortifying its Bengal settlement?', hi: 'Company ने Bengal settlement की fortification कब शुरू की?' },
        options: [
          { en: '1696', hi: '1696' },
          { en: '1651', hi: '1651' },
          { en: '1757', hi: '1757' },
          { en: '1765', hi: '1765' },
        ],
        correct: 0,
        explanation: { en: 'Fortification began in 1696 — a key SSC date.', hi: 'Fortification 1696 में शुरू हुई — important SSC date।' },
        sourceId: 'ncert-class8-trade-territory',
      },
      {
        q: { en: 'In which year was the Battle of Plassey fought?', hi: 'Battle of Plassey किस वर्ष लड़ी गई?' },
        options: [
          { en: '1757', hi: '1757' },
          { en: '1764', hi: '1764' },
          { en: '1765', hi: '1765' },
          { en: '1857', hi: '1857' },
        ],
        correct: 0,
        explanation: { en: 'Plassey was fought in 1757; Buxar was in 1764 — do not confuse the two.', hi: 'Plassey 1757 में; Buxar 1764 में — दोनों confuse mat karo।' },
        sourceId: 'ncert-class8-trade-territory',
      },
      {
        q: { en: 'Who were allied against the East India Company at the Battle of Buxar?', hi: 'Battle of Buxar में East India Company के विरुद्ध कौन allied थे?' },
        options: [
          { en: 'Mir Qasim, Shuja-ud-Daulah and Shah Alam II', hi: 'Mir Qasim, Shuja-ud-Daulah और Shah Alam II' },
          { en: 'Sirajuddaulah and Mir Jafar only', hi: 'केवल Sirajuddaulah और Mir Jafar' },
          { en: 'Mir Jafar and Robert Clive', hi: 'Mir Jafar और Robert Clive' },
          { en: 'Mughal Emperor and French only', hi: 'Mughal Emperor और French only' },
        ],
        correct: 0,
        explanation: { en: 'The Buxar alliance included Mir Qasim, Shuja-ud-Daulah and Shah Alam II.', hi: 'Buxar alliance में Mir Qasim, Shuja-ud-Daulah और Shah Alam II शामिल थे।' },
        sourceId: 'nios-british-rule-establishment',
      },
      {
        q: { en: 'Who granted Diwani of Bengal, Bihar and Orissa to the Company?', hi: 'Bengal, Bihar और Orissa की Diwani Company को किसने दी?' },
        options: [
          { en: 'Shah Alam II', hi: 'Shah Alam II' },
          { en: 'Mir Jafar', hi: 'Mir Jafar' },
          { en: 'Sirajuddaulah', hi: 'Sirajuddaulah' },
          { en: 'Queen Elizabeth I', hi: 'Queen Elizabeth I' },
        ],
        correct: 0,
        explanation: { en: 'Shah Alam II granted Diwani in 1765 after the post-Buxar settlement.', hi: 'Shah Alam II ने 1765 में Diwani प्रदान की — Mir Jafar ने नहीं।' },
        sourceId: 'nios-british-rule-establishment',
      },
      {
        q: { en: 'Diwani rights covered which territories?', hi: 'Diwani rights किन territories पर लागू हुई?' },
        options: [
          { en: 'Bengal, Bihar and Orissa', hi: 'Bengal, Bihar and Orissa' },
          { en: 'Only Bengal', hi: 'केवल Bengal' },
          { en: 'All of India', hi: 'पूरे India' },
          { en: 'Madras and Bombay', hi: 'Madras and Bombay' },
        ],
        correct: 0,
        explanation: { en: 'Diwani covered Bengal, Bihar and Orissa — a frequently tested fact.', hi: 'Diwani Bengal, Bihar और Orissa पर लागू हुई।' },
        sourceId: 'nios-british-rule-establishment',
      },
      {
        q: { en: 'Diwani was primarily concerned with:', hi: 'Diwani मुख्य रूप से किससे संबंधित थी?' },
        options: [
          { en: 'Revenue administration and civil justice', hi: 'Revenue administration और civil justice' },
          { en: 'Criminal justice only', hi: 'केवल criminal justice' },
          { en: 'Military command', hi: 'Military command' },
          { en: 'Foreign diplomacy', hi: 'Foreign diplomacy' },
        ],
        correct: 0,
        explanation: { en: 'Diwani = revenue + civil justice. Criminal justice relates to Nizamat.', hi: 'Diwani = revenue + civil justice. Criminal justice Nizamat से जुड़ी है।' },
        sourceId: 'nios-british-rule-establishment',
      },
      {
        q: { en: 'In Dual Government, which statement is correct?', hi: 'Dual Government में कौन-सा statement सही है?' },
        options: [
          { en: 'Company had effective power; Nawab had formal responsibility without adequate resources', hi: 'Company के पास effective power; Nawab के पास formal responsibility लेकिन inadequate resources' },
          { en: 'Company and Nawab shared equal power', hi: 'Company और Nawab ने equal power share किया' },
          { en: 'Nawab controlled all revenue', hi: 'Nawab ने सारा revenue control किया' },
          { en: 'Crown directly ruled Bengal', hi: 'Crown ने सीधे Bengal rule किया' },
        ],
        correct: 0,
        explanation: { en: 'Power without responsibility — Company; responsibility without resources — Nawab.', hi: 'Power without responsibility — Company; responsibility without resources — Nawab।' },
        sourceId: 'nios-british-rule-establishment',
      },
    ],
  },

  sources: [
    { sourceId: 'ncert-class8-trade-territory' },
    { sourceId: 'nios-british-rule-establishment' },
    { sourceId: 'british-library-eic-charter' },
    { sourceId: 'uk-legislation-gov-india-1858' },
  ],

  finalCta: {
    title: { en: 'Revision complete?', hi: 'Revision पूरा हुआ?' },
    text: { en: 'Now strengthen your preparation with practice and detailed explanations.', hi: 'अब अपनी तैयारी को Practice के साथ और मजबूत करें।' },
    primary: { en: 'Start Practice Now', hi: 'Start Practice Now' },
    secondary: { en: 'Review Again', hi: 'Revision दोबारा' },
  },

  faqs: [
    {
      q: { en: 'Did Charter 1600 make the Company a government?', hi: 'क्या Charter 1600 ने Company को सरकार बना दिया?' },
      a: { en: 'No. It granted exclusive trading rights among English commercial groups — not sovereignty or territorial rule.', hi: 'नहीं। इसने विशेष व्यापारिक अधिकार दिए — sovereignty या territorial rule नहीं।' },
      sourceId: 'ncert-class8-trade-territory',
    },
    {
      q: { en: 'Where was the first Bengal factory?', hi: 'पहली Bengal factory कहाँ थी?' },
      a: { en: 'On the Hugli river in 1651 — not Calcutta.', hi: '1651 में Hugli नदी के किनारे — Calcutta में नहीं।' },
      sourceId: 'ncert-class8-trade-territory',
    },
    {
      q: { en: 'What is the difference between Diwani and Nizamat?', hi: 'Diwani और Nizamat में क्या अंतर है?' },
      a: { en: 'Diwani covers revenue and civil justice; Nizamat covers law and order and criminal justice.', hi: 'Diwani राजस्व और civil justice; Nizamat law and order और criminal justice।' },
      sourceId: 'nios-british-rule-establishment',
    },
    {
      q: { en: 'Who granted Diwani to the Company?', hi: 'Company को Diwani किसने दी?' },
      a: { en: 'Mughal Emperor Shah Alam II in 1765, not Mir Jafar.', hi: 'Mughal Emperor Shah Alam II ने 1765 में — Mir Jafar ने नहीं।' },
      sourceId: 'nios-british-rule-establishment',
    },
    {
      q: { en: 'When did Crown rule replace Company rule?', hi: 'Company rule की जगह Crown rule कब आया?' },
      a: { en: 'Direct Crown rule began in 1858 after the transfer of power from the Company.', hi: '1858 में Company से शक्ति हस्तांतरण के बाद direct Crown rule शुरू हुआ।' },
      sourceId: 'nios-british-rule-establishment',
    },
  ],
};
