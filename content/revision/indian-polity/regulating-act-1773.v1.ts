/**
 * Frontend-owned revision content for Regulating Act, 1773.
 * Version: indian-polity/constitutional-history-making/regulating-act-1773.v1
 */

export const REGULATING_ACT_REVISION_VERSION =
  'indian-polity/constitutional-history-making/regulating-act-1773.v1';

export type BiString = { en: string; hi: string };

export type RegulatingActMindmapNode = {
  id: string;
  label: BiString;
  sectionId?: string;
  color?: string;
  sourceId?: string;
  children?: RegulatingActMindmapNode[];
};

export type SourceRef = { sourceId: string; label?: BiString };

export const regulatingActRevisionContent = {
  version: REGULATING_ACT_REVISION_VERSION,
  subjectSlug: 'indian-polity',
  topicSlug: 'constitutional-history-making',
  subtopicSlug: 'regulating-act-1773',
  estimatedMinutes: { min: 12, max: 15 },

  badges: {
    subject: { en: 'Indian Polity', hi: 'भारतीय राजनीति' },
    topic: { en: 'Topic 1', hi: 'विषय 1' },
    subtopic: { en: 'Subtopic 2', hi: 'उप-विषय 2' },
  },

  title: {
    en: 'Regulating Act, 1773',
    hi: 'रेगुलेटिंग एक्ट, 1773',
  },

  intro: {
    en: 'The Regulating Act, 1773 was the first major British parliamentary statute to regulate the East India Company’s territorial administration in India. It created the office of Governor-General of Bengal with an executive council, authorised a Supreme Court at Fort William, and began a centralising framework over the presidencies — without ending Company rule or placing India under direct Crown government.',
    hi: 'रेगुलेटिंग एक्ट, 1773 पहला प्रमुख ब्रिटिश संसदीय अधिनियम था जिसने भारत में ईस्ट इंडिया कंपनी के प्रशासन को विनियमित किया। इसने बंगाल के गवर्नर-जनरल और कार्यकारी परिषद की स्थापना की, फोर्ट विलियम में सुप्रीम कोर्ट के लिए अधिकार प्रदान किया, और प्रेसidencyों पर केंद्रीकरण की दिशा में पहला ढाँचा बनाया — कंपनी शासन समाप्त किए बिना और भारत को सीधे Crown शासन में नहीं लाए।',
  },

  metadata: {
    difficulty: { en: 'Medium', hi: 'मध्यम' },
    languages: { en: 'English + हिंदी', hi: 'English + हिंदी' },
    verified: { en: 'Source Verified', hi: 'स्रोत सत्यापित' },
  },

  cta: {
    startRevision: { en: 'Start Revision', hi: 'पुनरावृत्ति शुरू करें' },
    startMcqs: { en: 'Start 30 MCQs', hi: '30 MCQ शुरू करें' },
    finalHeading: {
      en: 'Ready to Test Your Understanding?',
      hi: 'क्या आप अपनी समझ जाँचने के लिए तैयार हैं?',
    },
    finalSupport: {
      en: 'Reinforce your learning with source-verified practice questions.',
      hi: 'स्रोत-सत्यापित अभ्यास प्रश्नों से अपनी सीख को मजबूत करें।',
    },
    finalMcqs: { en: 'Start 30 MCQs →', hi: '30 MCQ शुरू करें →' },
  },

  toc: [
    { id: 'snapshot', en: 'Quick Snapshot', hi: 'त्वरित सार', icon: 'Zap' },
    { id: 'story', en: 'Historical Story', hi: 'ऐतिहासिक क्रम', icon: 'BookOpen' },
    { id: 'why-passed', en: 'Why the Act Was Passed', hi: 'अधिनियम क्यों', icon: 'HelpCircle' },
    { id: 'provisions', en: 'Major Provisions', hi: 'प्रमुख प्रावधान', icon: 'FileText' },
    { id: 'council', en: 'Governor-General and Council', hi: 'गवर्नर-जनरल', icon: 'Users' },
    { id: 'supreme-court', en: 'Supreme Court at Fort William', hi: 'सुप्रीम कोर्ट', icon: 'Scale' },
    { id: 'significance', en: 'Significance vs Limitations', hi: 'महत्व बनाम सीमाएँ', icon: 'GitCompare' },
    { id: 'comparison', en: '1773 vs 1781', hi: '1773 बनाम 1781', icon: 'Columns' },
    { id: 'facts', en: 'High-Yield Facts', hi: 'महत्वपूर्ण तथ्य', icon: 'Star' },
    { id: 'traps', en: 'Exam Traps', hi: 'परीक्षा जाल', icon: 'AlertTriangle' },
    { id: 'recall', en: 'Active Recall', hi: 'सक्रिय स्मरण', icon: 'Brain' },
    { id: 'faq', en: 'FAQs', hi: 'अक्सर पूछे जाने वाले', icon: 'MessageCircle' },
    { id: 'sources', en: 'Sources and Evidence', hi: 'स्रोत', icon: 'ExternalLink' },
    { id: 'mindmap', en: 'Mind Map', hi: 'माइंड मैप', icon: 'Network' },
  ] as const,

  coverage: [
    { en: 'Background', hi: 'पृष्ठभूमि' },
    { en: 'Governor-General and Council', hi: 'गवर्नर-जनरल और परिषद' },
    { en: 'Supreme Court at Fort William', hi: 'फोर्ट विलियम सुप्रीम कोर्ट' },
    { en: 'Significance', hi: 'महत्व' },
    { en: 'Limitations', hi: 'सीमाएँ' },
    { en: 'Exam Traps', hi: 'परीक्षा जाल' },
    { en: 'Mind Map', hi: 'माइंड मैप' },
  ],

  snapshot: {
    title: { en: 'Quick Revision Snapshot', hi: 'त्वरित पुनरावृत्ति सार' },
    cards: [
      {
        id: 'year',
        label: { en: 'Year', hi: 'वर्ष' },
        value: { en: '1773', hi: '1773' },
        tint: 'violet',
        icon: 'Calendar',
        sourceId: 'regulating-act-1773',
        tooltip: {
          en: 'Passed by the British Parliament as 13 Geo. 3 c. 63.',
          hi: '13 Geo. 3 c. 63 के रूप में ब्रिटिश संसद द्वारा पारित।',
        },
      },
      {
        id: 'citation',
        label: { en: 'Statutory citation', hi: 'विधिक उद्धरण' },
        value: { en: '13 Geo. 3 c. 63', hi: '13 Geo. 3 c. 63' },
        tint: 'indigo',
        icon: 'ScrollText',
        sourceId: 'regulating-act-1773',
        tooltip: {
          en: 'Also known as the East India Company Act 1773.',
          hi: 'ईस्ट इंडिया कंपनी अधिनियम 1773 के नाम से भी जाना जाता है।',
        },
      },
      {
        id: 'first-gg',
        label: { en: 'First Governor-General of Bengal', hi: 'बंगाल के पहले गवर्नर-जनरल' },
        value: { en: 'Warren Hastings', hi: 'वारren हेस्टिंgs' },
        tint: 'purple',
        icon: 'Crown',
        sourceId: 'nios-constitutional-development',
        tooltip: {
          en: 'Hastings served as the first Governor-General under the new framework (from 1774).',
          hi: 'हेस्टिंgs नए ढाँचे के तहत पहले गवर्नर-जनरल थे (1774 से)।',
        },
      },
      {
        id: 'council',
        label: { en: 'Council structure', hi: 'परिषद संरचना' },
        value: { en: '4-member Executive Council', hi: '4-सदस्यीय कार्यकारी परिषद' },
        tint: 'blue',
        icon: 'Users',
        sourceId: 'regulating-act-1773',
        tooltip: {
          en: 'Governor-General was to act with the aid and consent of the council in important matters.',
          hi: 'महत्वपूर्ण मामलों में गवर्नर-जनरल को परिषद की सहायता और सहमति से कार्य करना था।',
        },
      },
      {
        id: 'court',
        label: { en: 'Supreme Court framework', hi: 'सुप्रीम कोर्ट ढाँचा' },
        value: { en: 'Authorised 1773; established 26 Mar 1774', hi: '1773 में अधिकृत; 26 मार्च 1774 में स्थापित' },
        tint: 'teal',
        icon: 'Scale',
        sourceId: 'nios-constitutional-development',
        tooltip: {
          en: 'Statutory authorisation and Charter-based establishment are distinct events.',
          hi: 'वैधानिक अधिकरण और Charter द्वारा स्थापना अलग घटनाएँ हैं।',
        },
      },
      {
        id: 'significance',
        label: { en: 'Core significance', hi: 'मुख्य महत्व' },
        value: { en: 'First parliamentary regulation of Company rule', hi: 'कंपनी शासन का पहला संसदीय विनियमन' },
        tint: 'green',
        icon: 'Landmark',
        sourceId: 'uk-parliament-eic',
        tooltip: {
          en: 'Beginning of parliamentary control — not direct Crown rule over India.',
          hi: 'संसदीय नियंत्रण की शुरुआत — भारत पर सीधा Crown शासन नहीं।',
        },
      },
    ],
  },

  story: {
    title: {
      en: 'Historical Story: From Expansion to Regulation',
      hi: 'ऐतिहासिक क्रम: विस्तार से विनियमन तक',
    },
    steps: [
      {
        id: 'expansion',
        number: 1,
        heading: { en: 'East India Company expansion', hi: 'ईस्ट इंडिया कंपनी का विस्तार' },
        body: {
          en: 'After Plassey (1757) and Buxar (1764), the Company acquired diwani rights in Bengal and expanded territorial revenue control, transforming from a trading body into a territorial power.',
          hi: 'प्लासी (1757) और बक्सar (1764) के बाद कंपनी ने बंगाल में दीवानी अधिकार प्राप्त किए और राजस्व नियंत्रण बढ़ाया, व्यापारिक संस्था से territorial power बन गई।',
        },
        sourceId: 'nios-constitutional-development',
        visual: 'ship',
      },
      {
        id: 'crisis',
        number: 2,
        heading: { en: 'Financial and administrative problems', hi: 'वित्तीय और प्रशासनिक समस्याएँ' },
        body: {
          en: 'Revenue mismanagement, corruption among company servants, and famines raised concerns in London about unchecked Company power and accountability.',
          hi: 'राजस्व दुरुपयोग, कंपनी कर्मचारियों में भ्रष्टाचार और अकाल ने लंदन में बिना जाँच Company शक्ति की चिंता बढ़ाई।',
        },
        sourceId: 'uk-parliament-eic',
        visual: 'ledger',
      },
      {
        id: 'parliament',
        number: 3,
        heading: { en: 'Parliamentary intervention', hi: 'संसदीय हस्तक्षेप' },
        body: {
          en: 'British Parliament moved to regulate Company affairs — asserting sovereign legislative authority over a corporation that had become a de facto ruler in India.',
          hi: 'ब्रिटिश संसद ने कंपनी के मामलों को विनियमित करने का कदम उठाया — भारत में de facto शासक बनी निगम पर संप्रभु विधायी अधिकार।',
        },
        sourceId: 'uk-parliament-eic',
        visual: 'parliament',
      },
      {
        id: 'act',
        number: 4,
        heading: { en: 'Regulating Act, 1773', hi: 'रेगुलेटिंग एक्ट, 1773' },
        body: {
          en: 'Parliament passed the Regulating Act to restructure Bengal’s government, create a Governor-General and Council, authorise a Supreme Court, and impose initial accountability rules on Company servants.',
          hi: 'संसद ने बंगाल सरकार का पुनर्गठन, गवर्नर-जनरल और परिषद, सुप्रीम कोर्ट अधिकरण और कंपनी कर्मचारियों पर जवाबदेही नियम लागू करने के लिए Regulating Act पारित किया।',
        },
        sourceId: 'regulating-act-1773',
        visual: 'statute',
      },
    ],
  },

  whyPassed: {
    title: { en: 'Why the Act Was Passed', hi: 'अधिनियम क्यों पारित हुआ' },
    rows: [
      {
        cause: { en: 'Administrative disorder in Bengal', hi: 'बंगाल में प्रशासनिक अव्यवस्था' },
        effect: { en: 'Needed a unified executive head with a council for Bengal', hi: 'बंगाल के लिए एकीकृत कार्यकारी प्रमुख और परिषद आवश्यक' },
        sourceId: 'regulating-act-1773',
        icon: 'Building2',
      },
      {
        cause: { en: 'Financial crisis and Company debt', hi: 'वित्तीय संकट और कंपनी का ऋण' },
        effect: { en: 'Parliament sought revenue accountability and regulation', hi: 'संसद ने राजस्व जवाबदेही और विनियमन चाहा' },
        sourceId: 'uk-parliament-eic',
        icon: 'Coins',
      },
      {
        cause: { en: 'Need for central supervision', hi: 'केंद्रीय पर्यवेक्षण की आवश्यकता' },
        effect: {
          en: 'Governor-General and Council given supervisory powers over presidencies in defined matters',
          hi: 'निर्धारित मामलों में प्रेसidencyों पर गवर्नर-जनरल और परिषद को पर्यवेक्षी शक्तियाँ',
        },
        sourceId: 'regulating-act-1773',
        icon: 'Network',
      },
      {
        cause: { en: 'Judicial and governance concerns', hi: 'न्यायिक और शासन संबंधी चिंताएँ' },
        effect: { en: 'Supreme Court at Fort William authorised for British subjects', hi: 'ब्रिटिश subjects के लिए फोर्ट विलियम में सुप्रीम कोर्ट अधिकृत' },
        sourceId: 'regulating-act-1773',
        icon: 'Gavel',
      },
    ],
  },

  provisions: {
    title: { en: 'Major Provisions of the Act', hi: 'अधिनियम के प्रमुख प्रावधान' },
    tabs: [
      {
        id: 'administrative',
        label: { en: 'Administrative', hi: 'प्रशासनिक' },
        items: [
          {
            provision: { en: 'Created Governor-General of Bengal with a 4-member Executive Council.', hi: '4-सदस्यीय कार्यकारी परिषद के साथ बंगाल के गवर्नर-जनरल की स्थापना।' },
            why: { en: 'Unified Bengal’s executive authority under one head.', hi: 'बंगाल की कार्यकारी शक्ति एक प्रमुख के अंतर्गत एकीकृत।' },
            exam: { en: 'Do not confuse with Governor-General of India (1858/1935 context).', hi: 'Governor-General of India (1858/1935) से भ्रम न करें।' },
            sourceId: 'regulating-act-1773',
          },
          {
            provision: {
              en: 'Governor-General and Council could superintend, control and direct Bombay and Madras presidencies in war, peace, and revenue matters.',
              hi: 'गवर्नर-जनरल और परिषद युद्ध, शांति और राजस्व में बॉम्बे और मद्रास प्रेसidencyों का पर्यवेक्षण कर सकते थे।',
            },
            why: { en: 'First centralising tendency over presidencies.', hi: 'प्रेसidencyों पर पहली केंद्रीकरण प्रवृत्ति।' },
            exam: { en: 'Supervision ≠ complete abolition of presidency governments.', hi: 'पर्यवेक्षण ≠ प्रेसidency सरकारों का पूर्ण उन्मूलन।' },
            sourceId: 'regulating-act-1773',
          },
          {
            provision: { en: 'Prohibited Company servants from accepting gifts and required property disclosure.', hi: 'कंपनी कर्मचारियों को उपहार स्वीकार करने पर प्रतिबंध और संपत्ति प्रकटीकरण।' },
            why: { en: 'Addressed corruption after territorial expansion.', hi: 'Territorial विस्तार के बाद भ्रष्टाचार पर प्रहार।' },
            exam: { en: 'Accountability clause — not full parliamentary control over trade monopoly.', hi: 'जवाबदेही खंड — व्यापार monopoly पर पूर्ण संसदीय नियंत्रण नहीं।' },
            sourceId: 'regulating-act-1773',
          },
        ],
      },
      {
        id: 'judicial',
        label: { en: 'Judicial', hi: 'न्यायिक' },
        items: [
          {
            provision: { en: 'Authorised establishment of Supreme Court at Fort William, Calcutta.', hi: 'कलकत्ता, फोर्ट विलियम में सुप्रीम कोर्ट की स्थापना अधिकृत।' },
            why: { en: 'Provided a Crown-chartered court for British subjects in Bengal.', hi: 'बंगाल में ब्रिटिश subjects के लिए Crown-chartered न्यायालय।' },
            exam: { en: '1773 Act authorises; 26 March 1774 Charter establishes — do not merge dates.', hi: '1773 Act अधिकृत करता है; 26 मार्च 1774 Charter स्थापित करता है — तिथियाँ मिलाएँ नहीं।' },
            sourceId: 'regulating-act-1773',
          },
          {
            provision: { en: 'Supreme Court had jurisdiction over British subjects; not a full national court for all Indians.', hi: 'सुप्रीम कोर्ट का अधिकार क्षेत्र ब्रिटिश subjects पर; सभी भारतीयों के लिए राष्ट्रीय न्यायालय नहीं।' },
            why: { en: 'Colonial judicial framework with limited personal jurisdiction.', hi: 'सीमित personal jurisdiction वाला colonial न्यायिक ढाँचा।' },
            exam: { en: 'Not the Supreme Court of India (1950).', hi: 'Supreme Court of India (1950) नहीं।' },
            sourceId: 'nios-constitutional-development',
          },
        ],
      },
      {
        id: 'accountability',
        label: { en: 'Company Accountability', hi: 'कंपनी जवाबदेही' },
        items: [
          {
            provision: { en: 'Company required to report and be subject to parliamentary oversight mechanisms introduced by the Act.', hi: 'कंपनी को रिपोर्ट करना और Act द्वारा परिचित संसदीय oversight के अधीन रहना।' },
            why: { en: 'First step toward parliamentary control over Company rule.', hi: 'कंपनी शासन पर संसदीय नियंत्रण की पहली दिशा।' },
            exam: { en: 'Regulation ≠ Crown rule; Company continued to govern.', hi: 'विनियमन ≠ Crown शासन; कंपनी शासन जारी रही।' },
            sourceId: 'uk-parliament-eic',
          },
          {
            provision: { en: 'Court of Directors retained corporate structure; Act reformed Indian administration, not abolished the Company.', hi: 'Court of Directors ने corporate संरचना बनाए रखी; Act ने भारतीय प्रशासन में सुधार किया, कंपनी समाप्त नहीं की।' },
            why: { en: 'Regulation within Company framework.', hi: 'कंपनी ढाँचे के भीतर विनियमन।' },
            exam: { en: 'Trap: “End of Company rule in 1773” is incorrect.', hi: 'जाल: “1773 में कंपनी शासन समाप्त” गलत है।' },
            sourceId: 'regulating-act-1773',
          },
        ],
      },
    ],
  },

  councilDiagram: {
    title: { en: 'Governor-General and Council', hi: 'गवर्नर-जनरल और परिषद' },
    warning: {
      en: 'Governor-General of Bengal was not the later Governor-General of India.',
      hi: 'बंगाल के गवर्नर-जनरल बाद के Governor-General of India नहीं थे।',
    },
    note: {
      en: 'The Governor-General acted with a four-member council. In defined matters, this body could direct Bombay and Madras — but presidencies retained their own governments.',
      hi: 'गवर्नर-जनरल चार-सदस्यीय परिषद के साथ कार्य करते थे। निर्धारित मामलों में यह निकाय बॉम्बे और मद्रास को निर्देशित कर सकता था — पर प्रेसidencyों की अपनी सरकारें रहीं।',
    },
    sourceId: 'regulating-act-1773',
  },

  courtTimeline: {
    title: { en: 'Supreme Court at Fort William: Timeline', hi: 'फोर्ट विलियम सुप्रीम कोर्ट: समयरेखा' },
    stages: [
      {
        year: '1773',
        label: { en: 'Statutory authorisation', hi: 'वैधानिक अधिकरण' },
        description: {
          en: 'Regulating Act authorised a Supreme Court at Fort William for Bengal.',
          hi: 'Regulating Act ने बंगाल के लिए फोर्ट विलियम में सुप्रीम कोर्ट अधिकृत किया।',
        },
        sourceId: 'regulating-act-1773',
        icon: 'statute',
      },
      {
        year: '1774',
        label: { en: 'Charter establishment (26 March)', hi: 'Charter द्वारा स्थापना (26 मार्च)' },
        description: {
          en: 'Supreme Court of Judicature at Fort William inaugurated by Royal Charter.',
          hi: 'Royal Charter द्वारा फोर्ट विलियम में Supreme Court of Judicature का उद्घाटन।',
        },
        sourceId: 'nios-constitutional-development',
        icon: 'court',
      },
      {
        year: '1774–1781',
        label: { en: 'Institutional conflict', hi: 'संस्थागत संघर्ष' },
        description: {
          en: 'Jurisdictional clashes between Supreme Court and Company courts / Council.',
          hi: 'सुप्रीम कोर्ट और कंपनी न्यायालय / परिषद के बीच अधिकार क्षेत्र संघर्ष।',
        },
        sourceId: 'nios-constitutional-development',
        icon: 'conflict',
      },
      {
        year: '1781',
        label: { en: 'Act of Settlement correction', hi: 'Act of Settlement सुधार' },
        description: {
          en: 'Act of Settlement 1781 clarified jurisdiction over revenue and executive acts.',
          hi: 'Act of Settlement 1781 ने राजस्व और कार्यकारी कार्यों पर अधिकार क्षेत्र स्पष्ट किया।',
        },
        sourceId: 'act-of-settlement-1781',
        icon: 'correction',
      },
    ],
  },

  significanceLimitations: {
    significance: {
      title: { en: 'Significance', hi: 'महत्व' },
      items: [
        { text: { en: 'First parliamentary regulation of the East India Company in India.', hi: 'भारत में ईस्ट इंडिया कंपनी का पहला संसदीय विनियमन।' }, sourceId: 'uk-parliament-eic' },
        { text: { en: 'Created the Governor-General and Council framework for Bengal.', hi: 'बंगाल के लिए गवर्नर-जनरल और परिषद ढाँचा।' }, sourceId: 'regulating-act-1773' },
        { text: { en: 'Laid foundation for a Crown-chartered Supreme Court at Calcutta.', hi: 'कलकत्ता में Crown-chartered सुप्रीम कोर्ट की नींव।' }, sourceId: 'regulating-act-1773' },
        { text: { en: 'Marked a centralising tendency over Bombay and Madras in defined matters.', hi: 'निर्धारित मामलों में बॉम्बे और मद्रास पर केंद्रीकरण की प्रवृत्ति।' }, sourceId: 'regulating-act-1773' },
        { text: { en: 'Paved the way for later Acts (1781, 1784, 1793).', hi: 'बाद के Acts (1781, 1784, 1793) का मार्ग प्रशस्त।' }, sourceId: 'nios-constitutional-development' },
      ],
    },
    limitations: {
      title: { en: 'Limitations', hi: 'सीमाएँ' },
      items: [
        { text: { en: 'Council often deadlocked with the Governor-General (majority rule issues).', hi: 'परिषद अक्सर गवर्नर-जनरल से टकराव में (बहुमत नियम)।' }, sourceId: 'nios-constitutional-development' },
        { text: { en: 'Judicial ambiguity led to conflict with Company courts until 1781.', hi: 'न्यायिक अस्पष्टता 1781 तक कंपनी न्यायालयों से संघर्ष।' }, sourceId: 'act-of-settlement-1781' },
        { text: { en: 'Parliamentary control remained limited; Company retained governing role.', hi: 'संसदीय नियंत्रण सीमित; कंपनी की शासक भूमिका बनी रही।' }, sourceId: 'uk-parliament-eic' },
        { text: { en: 'Administrative overlap between Supreme Court and Council persisted.', hi: 'सुप्रीम कोर्ट और परिषद के बीच प्रशासनिक ओवरलैप।' }, sourceId: 'nios-constitutional-development' },
        { text: { en: 'Did not end corruption or financial problems entirely.', hi: 'भ्रष्टाचार या वित्तीय समस्याएँ पूर्णतः समाप्त नहीं हुईं।' }, sourceId: 'nios-constitutional-development' },
      ],
    },
  },

  comparison: {
    title: { en: 'Regulating Act, 1773 vs Act of Settlement, 1781', hi: 'Regulating Act, 1773 बनाम Act of Settlement, 1781' },
    rows: [
      {
        aspect: { en: 'Nature', hi: 'प्रकृति' },
        act1773: { en: 'Foundational regulating statute', hi: 'आधारभूत विनियमन अधिनियम' },
        act1781: { en: 'Corrective / clarifying statute', hi: 'सुधारात्मक / स्पष्टीकरण अधिनियम' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        aspect: { en: 'Main purpose', hi: 'मुख्य उद्देश्य' },
        act1773: { en: 'Regulate Company rule; create GG and Council; authorise Supreme Court', hi: 'कंपनी शासन विनियमन; GG और परिषद; सुप्रीम कोर्ट अधिकरण' },
        act1781: { en: 'Resolve jurisdictional conflicts between courts and Company government', hi: 'न्यायालय और कंपनी सरकार के बीच अधिकार क्षेत्र संघर्ष समाधान' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        aspect: { en: 'Governor-General and Council', hi: 'गवर्नर-जनरल और परिषद' },
        act1773: { en: 'Created office and 4-member council for Bengal', hi: 'बंगाल के लिए पद और 4-सदस्यीय परिषद' },
        act1781: { en: 'Did not abolish the council; focused on court–government jurisdiction', hi: 'परिषद समाप्त नहीं की; न्यायालय–सरकार अधिकार क्षेत्र पर केंद्रित' },
        sourceId: 'regulating-act-1773',
      },
      {
        aspect: { en: 'Supreme Court', hi: 'सुप्रीम कोर्ट' },
        act1773: { en: 'Authorised establishment at Fort William', hi: 'फोर्ट विलियम में स्थापना अधिकृत' },
        act1781: { en: 'Restricted court’s interference in revenue and executive acts of Council', hi: 'परिषद के राजस्व और कार्यकारी कार्यों में कोर्ट के हस्तक्षेप को सीमित' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        aspect: { en: 'Jurisdiction', hi: 'अधिकार क्षेत्र' },
        act1773: { en: 'Broad authorisation; ambiguities emerged in practice', hi: 'व्यापक अधिकरण; व्यवहार में अस्पष्टताएँ' },
        act1781: { en: 'Clarified limits on Supreme Court over Company servants and revenue', hi: 'कंपनी कर्मचारियों और राजस्व पर सुप्रीम कोर्ट की सीमाएँ स्पष्ट' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        aspect: { en: 'Revenue matters', hi: 'राजस्व मामले' },
        act1773: { en: 'Council given revenue-related supervisory powers over presidencies', hi: 'परिषद को प्रेसidencyों पर राजस्व-संबंधी पर्यवेक्षी शक्तियाँ' },
        act1781: { en: 'Protected revenue collection from Supreme Court jurisdiction', hi: 'राजस्व संग्रह को सुप्रीम कोर्ट अधिकार क्षेत्र से सुरक्षित' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        aspect: { en: 'Executive actions', hi: 'कार्यकारी कार्य' },
        act1773: { en: 'Governor-General and Council as unified executive for Bengal', hi: 'बंगाल के लिए गवर्नर-जनरल और परिषद एकीकृत कार्यकारी' },
        act1781: { en: 'Shielded executive acts of servants from court interference', hi: 'कर्मचारियों के कार्यकारी कार्यों को कोर्ट हस्तक्षेप से सुरक्षित' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        aspect: { en: 'Historical importance', hi: 'ऐतिहासिक महत्व' },
        act1773: { en: 'Beginning of parliamentary regulation of Company rule', hi: 'कंपनी शासन के संसदीय विनियमन की शुरुआत' },
        act1781: { en: 'First major judicial–executive correction in Company India', hi: 'कंपनी भारत में पहला प्रमुख न्यायिक–कार्यकारी सुधार' },
        sourceId: 'nios-constitutional-development',
      },
    ],
  },

  facts: {
    title: { en: 'High-Yield Facts', hi: 'महत्वपूर्ण तथ्य' },
    filters: [
      { id: 'easy', label: { en: 'Easy', hi: 'आसान' } },
      { id: 'moderate', label: { en: 'Moderate', hi: 'मध्यम' } },
      { id: 'advanced', label: { en: 'Advanced', hi: 'उन्नत' } },
    ],
    items: [
      {
        level: 'easy',
        fact: { en: 'Regulating Act was passed in 1773.', hi: 'Regulating Act 1773 में पारित हुआ।' },
        exam: { en: 'Year recall — foundational date.', hi: 'वर्ष स्मरण — आधारभूत तिथि।' },
        sourceId: 'regulating-act-1773',
      },
      {
        level: 'easy',
        fact: { en: 'Warren Hastings was the first Governor-General of Bengal.', hi: 'वारren हेस्टिंgs बंगाल के पहले गवर्नर-जनरल थे।' },
        exam: { en: 'Name association — not GG of India.', hi: 'नाम संबद्धता — GG of India नहीं।' },
        sourceId: 'nios-constitutional-development',
      },
      {
        level: 'moderate',
        fact: { en: 'Executive Council had four members besides the Governor-General.', hi: 'गवर्नर-जनरल के अलावा कार्यकारी परिषद में चार सदस्य।' },
        exam: { en: 'Count council members correctly.', hi: 'परिषद सदस्यों की संख्या सही रखें।' },
        sourceId: 'regulating-act-1773',
      },
      {
        level: 'moderate',
        fact: { en: 'Supreme Court was established at Fort William, Calcutta.', hi: 'सुप्रीम कोर्ट कलकत्ता, फोर्ट विलियम में स्थापित।' },
        exam: { en: 'Location — not Bombay or Madras.', hi: 'स्थान — बॉम्बे या मद्रास नहीं।' },
        sourceId: 'regulating-act-1773',
      },
      {
        level: 'moderate',
        fact: { en: 'Act of Settlement 1781 followed to fix court–government conflicts.', hi: 'कोर्ट–सरकार संघर्ष सुधार के लिए 1781 का Act of Settlement आया।' },
        exam: { en: 'Chronology pair: 1773 then 1781.', hi: 'कालक्रम जोड़ी: 1773 फिर 1781।' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        level: 'advanced',
        fact: { en: '1773 Act authorises Supreme Court; 26 March 1774 Charter establishes it.', hi: '1773 Act सुप्रीम कोर्ट अधिकृत करता है; 26 मार्च 1774 Charter स्थापित करता है।' },
        exam: { en: 'Separate authorisation from inauguration.', hi: 'अधिकरण और उद्घाटन अलग रखें।' },
        sourceId: 'nios-constitutional-development',
      },
      {
        level: 'advanced',
        fact: { en: 'Governor-General could direct other presidencies only in defined matters.', hi: 'गवर्नर-जनरल अन्य प्रेसidencyों को केवल निर्धारित मामलों में निर्देशित कर सकते थे।' },
        exam: { en: 'Avoid “complete control over all presidencies”.', hi: '“सभी प्रेसidencyों पर पूर्ण नियंत्रण” से बचें।' },
        sourceId: 'regulating-act-1773',
      },
    ],
  },

  traps: {
    title: { en: 'Exam Traps', hi: 'परीक्षा जाल' },
    rows: [
      {
        incorrect: { en: 'Governor-General of India was created in 1773.', hi: '1773 में Governor-General of India बना।' },
        correct: { en: 'Governor-General of Bengal was created; “of India” came much later.', hi: 'बंगाल के गवर्नर-जनरल बने; “of India” बाद में।' },
        confusion: { en: 'Students conflate Bengal (1773) with India-wide office (1858 Act context).', hi: 'छात्र बंगाल (1773) को भारत-व्यापी पद (1858) से मिलाते हैं।' },
        sourceId: 'regulating-act-1773',
      },
      {
        incorrect: { en: 'Regulating Act ended East India Company rule.', hi: 'Regulating Act ने कंपनी शासन समाप्त किया।' },
        correct: { en: 'It regulated Company affairs; Crown rule came later (1858).', hi: 'इसने कंपनी मामलों को विनियमित किया; Crown शासन बाद में (1858)।' },
        confusion: { en: '“Regulation” sounds like takeover — but Company continued governing.', hi: '“Regulation” takeover जैसा लगता है — पर कंपनी शासन जारी रहा।' },
        sourceId: 'uk-parliament-eic',
      },
      {
        incorrect: { en: 'Supreme Court was established in 1773.', hi: 'सुप्रीम कोर्ट 1773 में स्थापित हुआ।' },
        correct: { en: 'Authorised in 1773; established by Charter on 26 March 1774.', hi: '1773 में अधिकृत; 26 मार्च 1774 Charter से स्थापित।' },
        confusion: { en: 'Act passage year confused with inauguration date.', hi: 'Act पारित होने का वर्ष उद्घाटन तिथि से भ्रमित।' },
        sourceId: 'nios-constitutional-development',
      },
      {
        incorrect: { en: 'Act of Settlement 1781 reduced the Council to three members.', hi: '1781 Act ने परिषद को तीन सदस्यों तक घटाया।' },
        correct: { en: '1781 Act clarified jurisdiction; it did not reduce the 1773 Council to three.', hi: '1781 Act ने अधिकार क्षेत्र स्पष्ट किया; 1773 परिषद तीन तक नहीं घटाई।' },
        confusion: { en: 'Coaching notes sometimes misstate 1781 council changes.', hi: 'Coaching notes कभी-कभी 1781 परिषद परिवर्तन गलत बताते हैं।' },
        sourceId: 'act-of-settlement-1781',
      },
      {
        incorrect: { en: 'Presidency governments were abolished in 1773.', hi: '1773 में प्रेसidency सरकारें समाप्त हुईं।' },
        correct: { en: 'Bombay and Madras retained governments; Bengal GG gained supervisory powers in defined matters.', hi: 'बॉम्बे और मद्रास की सरकारें रहीं; बंगाल GG को निर्धारित मामलों में पर्यवेक्षी शक्तियाँ मिलीं।' },
        confusion: { en: 'Centralisation overstated as complete merger of presidencies.', hi: 'केंद्रीकरण को प्रेसidency विलय के रूप में अतिरंजित।' },
        sourceId: 'regulating-act-1773',
      },
      {
        incorrect: { en: 'Supreme Court had unlimited jurisdiction over all Indians.', hi: 'सुप्रीम कोर्ट का सभी भारतीयों पर असीमित अधिकार क्षेत्र था।' },
        correct: { en: 'Jurisdiction focused on British subjects; conflicts led to 1781 clarification.', hi: 'अधिकार क्षेत्र ब्रिटिश subjects पर; संघर्ष 1781 स्पष्टीकरण की ओर।' },
        confusion: { en: 'Modern Supreme Court of India (1950) projected backward.', hi: 'आधुनिक Supreme Court of India (1950) पीछे प्रक्षेपित।' },
        sourceId: 'act-of-settlement-1781',
      },
    ],
  },

  recall: {
    title: { en: 'Active Recall', hi: 'सक्रिय स्मरण' },
    tabs: [
      { id: 'recall', label: { en: 'Recall Answer', hi: 'उत्तर स्मरण' } },
      { id: 'tf', label: { en: 'True / False', hi: 'सत्य / असत्य' } },
      { id: 'chrono', label: { en: 'Chronology', hi: 'कालक्रम' } },
    ],
    questions: {
      recall: [
        {
          q: { en: 'What statutory citation is used for the Regulating Act, 1773?', hi: 'Regulating Act, 1773 का विधिक उद्धरण क्या है?' },
          a: { en: '13 Geo. 3 c. 63 (East India Company Act 1773).', hi: '13 Geo. 3 c. 63 (East India Company Act 1773)।' },
          sourceId: 'regulating-act-1773',
        },
        {
          q: { en: 'Who was the first Governor-General of Bengal under this framework?', hi: 'इस ढाँचे के तहत बंगाल के पहले गवर्नर-जनरल कौन थे?' },
          a: { en: 'Warren Hastings.', hi: 'वारren हेस्टिंgs।' },
          sourceId: 'nios-constitutional-development',
        },
        {
          q: { en: 'How many members were on the Executive Council (besides the GG)?', hi: 'कार्यकारी परिषद में (GG के अलावा) कितने सदस्य थे?' },
          a: { en: 'Four members.', hi: 'चार सदस्य।' },
          sourceId: 'regulating-act-1773',
        },
      ],
      tf: [
        {
          q: { en: 'The Regulating Act placed India under direct British Crown rule.', hi: 'Regulating Act ने भारत को सीधे British Crown शासन में रखा।' },
          a: { en: 'False — it regulated the Company; Crown rule came in 1858.', hi: 'असत्य — इसने कंपनी को विनियमित किया; Crown शासन 1858 में।' },
          sourceId: 'uk-parliament-eic',
        },
        {
          q: { en: 'The Supreme Court at Fort William was authorised by the 1773 Act.', hi: 'फोर्ट विलियम सुप्रीम कोर्ट 1773 Act द्वारा अधिकृत था।' },
          a: { en: 'True.', hi: 'सत्य।' },
          sourceId: 'regulating-act-1773',
        },
        {
          q: { en: 'The Act of Settlement 1781 abolished the Governor-General’s Council.', hi: 'Act of Settlement 1781 ने गवर्नर-जनरल की परिषद समाप्त की।' },
          a: { en: 'False — it clarified jurisdiction, especially for the Supreme Court.', hi: 'असत्य — इसने अधिकार क्षेत्र स्पष्ट किया, विशेषकर सुप्रीम कोर्ट के लिए।' },
          sourceId: 'act-of-settlement-1781',
        },
      ],
      chrono: [
        {
          q: { en: 'Arrange: (A) Regulating Act (B) Supreme Court inauguration (C) Act of Settlement 1781', hi: 'क्रम में लगाएँ: (A) Regulating Act (B) सुप्रीम कोर्ट उद्घाटन (C) Act of Settlement 1781' },
          a: { en: 'A (1773) → B (26 March 1774) → C (1781).', hi: 'A (1773) → B (26 मार्च 1774) → C (1781)।' },
          sourceId: 'nios-constitutional-development',
        },
        {
          q: { en: 'Which came first: parliamentary regulation or Crown rule over India?', hi: 'पहले क्या आया: संसदीय विनियमन या भारत पर Crown शासन?' },
          a: { en: 'Parliamentary regulation (1773) long before Crown rule (1858).', hi: 'संसदीय विनियमन (1773) Crown शासन (1858) से बहुत पहले।' },
          sourceId: 'uk-parliament-eic',
        },
      ],
    },
  },

  faqs: [
    {
      q: { en: 'What was the main purpose of the Regulating Act, 1773?', hi: 'Regulating Act, 1773 का मुख्य उद्देश्य क्या था?' },
      a: {
        en: 'To regulate the East India Company’s territorial administration — creating a Governor-General and Council for Bengal, authorising a Supreme Court, and imposing initial accountability on Company servants.',
        hi: 'ईस्ट इंडिया कंपनी के territorial प्रशासन को विनियमित करना — बंगाल के लिए गवर्नर-जनरल और परिषद, सुप्रीम कोर्ट अधिकरण, और कंपनी कर्मचारियों पर प्रारंभिक जवाबदेही।',
      },
      sourceId: 'regulating-act-1773',
    },
    {
      q: { en: 'Who was the first Governor-General of Bengal?', hi: 'बंगाल के पहले गवर्नर-जनरल कौन थे?' },
      a: { en: 'Warren Hastings, serving from 1774 under the new framework.', hi: 'वारren हेस्टिंgs, 1774 से नए ढाँचे के तहत।' },
      sourceId: 'nios-constitutional-development',
    },
    {
      q: { en: 'How was the Executive Council structured?', hi: 'कार्यकारी परिषद की संरचना कैसी थी?' },
      a: { en: 'A four-member council assisted the Governor-General; important decisions required council consent.', hi: 'चार-सदस्यीय परिषद गवर्नर-जनरल की सहायता करती थी; महत्वपूर्ण निर्णयों के लिए परिषद की सहमति आवश्यक।' },
      sourceId: 'regulating-act-1773',
    },
    {
      q: { en: 'When was the Supreme Court at Fort William established?', hi: 'फोर्ट विलियम सुप्रीम कोर्ट कब स्थापित हुआ?' },
      a: { en: 'Authorised by the 1773 Act; inaugurated by Royal Charter on 26 March 1774.', hi: '1773 Act द्वारा अधिकृत; 26 मार्च 1774 को Royal Charter से उद्घाटन।' },
      sourceId: 'nios-constitutional-development',
    },
    {
      q: { en: 'What is the difference between 1773 and 1774 for the Supreme Court?', hi: 'सुप्रीम कोर्ट के लिए 1773 और 1774 में क्या अंतर है?' },
      a: { en: '1773 is statutory authorisation; 1774 is the Charter-based establishment date.', hi: '1773 वैधानिक अधिकरण है; 1774 Charter-आधारित स्थापना तिथि है।' },
      sourceId: 'regulating-act-1773',
    },
    {
      q: { en: 'Why is the Act historically significant?', hi: 'अधिनियम ऐतिहासिक रूप से क्यों महत्वपूर्ण है?' },
      a: { en: 'It was the first major British parliamentary step to regulate Company rule in India.', hi: 'यह भारत में कंपनी शासन को विनियमित करने का पहला प्रमुख ब्रिटिश संसदीय कदम था।' },
      sourceId: 'uk-parliament-eic',
    },
    {
      q: { en: 'What were its main limitations?', hi: 'इसकी मुख्य सीमाएँ क्या थीं?' },
      a: { en: 'Council deadlocks, judicial conflicts with Company courts, and incomplete parliamentary control.', hi: 'परिषद गतिरोध, कंपनी न्यायालयों से न्यायिक संघर्ष, और अपूर्ण संसदीय नियंत्रण।' },
      sourceId: 'nios-constitutional-development',
    },
    {
      q: { en: 'How did the Act of Settlement 1781 correct the 1773 framework?', hi: 'Act of Settlement 1781 ने 1773 ढाँचे को कैसे सुधारा?' },
      a: { en: 'It clarified Supreme Court jurisdiction over revenue and executive acts of the Company government.', hi: 'इसने कंपनी सरकार के राजस्व और कार्यकारी कार्यों पर सुप्रीम कोर्ट अधिकार क्षेत्र स्पष्ट किया।' },
      sourceId: 'act-of-settlement-1781',
    },
  ],

  sourceTiles: [
    { sourceId: 'regulating-act-1773' },
    { sourceId: 'act-of-settlement-1781' },
    { sourceId: 'nios-constitutional-development' },
    { sourceId: 'uk-parliament-eic' },
  ],

  mindmap: {
    title: { en: 'Mind Map: Regulating Act, 1773', hi: 'माइंड मैप: रेगुलेटिंग एक्ट, 1773' },
    root: {
      id: 'root',
      label: { en: 'Regulating Act, 1773', hi: 'रेगुलेटिंग एक्ट, 1773' },
      sectionId: 'snapshot',
      children: [
        {
          id: 'purpose',
          label: { en: 'Purpose', hi: 'उद्देश्य' },
          sectionId: 'why-passed',
          color: '#7C3AED',
          children: [
            { id: 'p1', label: { en: 'Parliamentary regulation', hi: 'संसदीय विनियमन' }, sectionId: 'why-passed' },
            { id: 'p2', label: { en: 'Company governance', hi: 'कंपनी शासन' }, sectionId: 'why-passed' },
            { id: 'p3', label: { en: 'Administrative restructuring', hi: 'प्रशासनिक पुनर्गठन' }, sectionId: 'provisions' },
          ],
        },
        {
          id: 'background',
          label: { en: 'Background', hi: 'पृष्ठभूमि' },
          sectionId: 'story',
          color: '#6366F1',
          children: [
            { id: 'b1', label: { en: 'Company expansion', hi: 'कंपनी विस्तार' }, sectionId: 'story' },
            { id: 'b2', label: { en: 'Financial crisis', hi: 'वित्तीय संकट' }, sectionId: 'story' },
            { id: 'b3', label: { en: 'Governance concerns', hi: 'शासन चिंताएँ' }, sectionId: 'why-passed' },
            { id: 'b4', label: { en: 'Parliamentary intervention', hi: 'संसदीय हस्तक्षेप' }, sectionId: 'story' },
          ],
        },
        {
          id: 'administration',
          label: { en: 'Administration', hi: 'प्रशासन' },
          sectionId: 'council',
          color: '#8B5CF6',
          children: [
            { id: 'a1', label: { en: 'Governor-General of Bengal', hi: 'बंगाल गवर्नर-जनरल' }, sectionId: 'council', sourceId: 'regulating-act-1773' },
            { id: 'a2', label: { en: 'Four-member Council', hi: 'चार-सदस्यीय परिषद' }, sectionId: 'council' },
            { id: 'a3', label: { en: 'Presidency relationship', hi: 'प्रेसidency संबंध' }, sectionId: 'council' },
          ],
        },
        {
          id: 'judiciary',
          label: { en: 'Judiciary', hi: 'न्यायपालिका' },
          sectionId: 'supreme-court',
          color: '#0D9488',
          children: [
            { id: 'j1', label: { en: 'Supreme Court framework', hi: 'सुप्रीम कोर्ट ढाँचा' }, sectionId: 'supreme-court' },
            { id: 'j2', label: { en: '1774 Charter', hi: '1774 Charter' }, sectionId: 'supreme-court' },
            { id: 'j3', label: { en: 'Fort William', hi: 'फोर्ट विलियम' }, sectionId: 'supreme-court' },
            { id: 'j4', label: { en: 'Institutional conflict', hi: 'संस्थागत संघर्ष' }, sectionId: 'supreme-court' },
          ],
        },
        {
          id: 'accountability',
          label: { en: 'Accountability', hi: 'जवाबदेही' },
          sectionId: 'provisions',
          color: '#D97706',
          children: [
            { id: 'ac1', label: { en: 'Company servants', hi: 'कंपनी कर्मचारी' }, sectionId: 'provisions' },
            { id: 'ac2', label: { en: 'Restrictions on gifts', hi: 'उपहार प्रतिबंध' }, sectionId: 'provisions' },
            { id: 'ac3', label: { en: 'Reporting', hi: 'रिपोर्टिंग' }, sectionId: 'provisions' },
            { id: 'ac4', label: { en: 'Oversight', hi: 'निरीक्षण' }, sectionId: 'provisions' },
          ],
        },
        {
          id: 'significance',
          label: { en: 'Significance', hi: 'महत्व' },
          sectionId: 'significance',
          color: '#16A34A',
          children: [
            { id: 's1', label: { en: 'Parliamentary control', hi: 'संसदीय नियंत्रण' }, sectionId: 'significance' },
            { id: 's2', label: { en: 'Centralising tendency', hi: 'केंद्रीकरण प्रवृत्ति' }, sectionId: 'significance' },
            { id: 's3', label: { en: 'Institutional foundation', hi: 'संस्थागत नींव' }, sectionId: 'significance' },
          ],
        },
        {
          id: 'limitations',
          label: { en: 'Limitations', hi: 'सीमाएँ' },
          sectionId: 'significance',
          color: '#DC2626',
          children: [
            { id: 'l1', label: { en: 'Judicial ambiguity', hi: 'न्यायिक अस्पष्टता' }, sectionId: 'significance' },
            { id: 'l2', label: { en: 'Council conflict', hi: 'परिषद संघर्ष' }, sectionId: 'significance' },
            { id: 'l3', label: { en: 'Incomplete framework', hi: 'अपूर्ण ढाँचा' }, sectionId: 'significance' },
          ],
        },
        {
          id: 'settlement-1781',
          label: { en: 'Act of Settlement, 1781', hi: 'Act of Settlement, 1781' },
          sectionId: 'comparison',
          color: '#2563EB',
          children: [
            { id: 'st1', label: { en: 'Corrective legislation', hi: 'सुधारात्मक विधि' }, sectionId: 'comparison', sourceId: 'act-of-settlement-1781' },
            { id: 'st2', label: { en: 'Jurisdictional clarification', hi: 'अधिकार क्षेत्र स्पष्टीकरण' }, sectionId: 'comparison' },
          ],
        },
        {
          id: 'exam-traps',
          label: { en: 'Exam Traps', hi: 'परीक्षा जाल' },
          sectionId: 'traps',
          color: '#EA580C',
          children: [
            { id: 't1', label: { en: '1773 vs 1774', hi: '1773 बनाम 1774' }, sectionId: 'traps' },
            { id: 't2', label: { en: 'Bengal vs India', hi: 'बंगाल बनाम भारत' }, sectionId: 'traps' },
            { id: 't3', label: { en: 'Regulation vs Crown rule', hi: 'विनियमन बनाम Crown' }, sectionId: 'traps' },
            { id: 't4', label: { en: '1773 vs 1781', hi: '1773 बनाम 1781' }, sectionId: 'traps' },
          ],
        },
      ],
    } satisfies RegulatingActMindmapNode,
  },
};
