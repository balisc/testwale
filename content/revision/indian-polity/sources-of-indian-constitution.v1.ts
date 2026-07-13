/**
 * Frontend-owned revision content.
 * Version: indian-polity/topic-2/sources-of-indian-constitution.v1
 * Do not fetch this body from Supabase.
 */

export const SOURCES_REVISION_VERSION = 'indian-polity/topic-2/sources-of-indian-constitution.v1';

export type BiString = { en: string; hi: string };

export type RevisionSourceCard = {
  id: string;
  title: BiString;
  chapter?: BiString;
  edition: BiString;
  locator: BiString;
  url: string;
  buttonLabel: BiString;
  verificationDate: BiString;
  accessibleName: BiString;
};

export type MindmapNode = {
  id: string;
  label: BiString;
  children?: MindmapNode[];
};

export const sourcesRevisionContent = {
  version: SOURCES_REVISION_VERSION,
  estimatedMinutes: 12,
  header: {
    title: {
      en: 'Sources of the Indian Constitution',
      hi: 'भारतीय संविधान के स्रोत',
    },
    subtitle: {
      en: 'Focused revision for Constitution Basics — learn, compare and remember before you practise again.',
      hi: 'Constitution Basics का focused revision — दोबारा अभ्यास से पहले सीखें, तुलना करें और याद रखें।',
    },
    reason: {
      en: 'Shown after three incorrect attempts in this subtopic — strengthen concepts before returning to questions.',
      hi: 'इस उपविषय में तीन गलत प्रयासों के बाद दिखाया जाता है — प्रश्नों पर लौटने से पहले अवधारणाएँ मजबूत करें।',
    },
  },
  cta: {
    label: {
      en: 'Practice Subtopic Questions',
      hi: 'इस उपविषय के प्रश्न हल करें',
    },
    support: {
      en: 'Revision complete? Apply these concepts in the complete Subtopic 2 question set.',
      hi: 'Revision पूरा हो गया? अब Subtopic 2 के सभी प्रश्नों पर इन concepts को लागू करें।',
    },
  },
  rescue: {
    title: { en: '60-Second Rescue Card', hi: '60-सेकंड Rescue Card' },
    hiLead: {
      hi: 'भारतीय संविधान किसी एक देश की नकल नहीं है। इसे चार बड़ी धाराओं ने आकार दिया:',
      en: 'The Indian Constitution was not copied from one country. It was shaped by four major streams:',
    },
    streams: [
      {
        en: 'The nationalist movement and its democratic commitments.',
        hi: 'राष्ट्रीय आंदोलन: स्वतंत्रता, समानता, लोकतंत्र, अल्पसंख्यक अधिकार और वयस्क मताधिकार जैसे मूल्य।',
      },
      {
        en: 'Colonial institutional experience, including details and procedures associated with the Government of India Act, 1935.',
        hi: 'औपनिवेशिक संस्थागत अनुभव: विधायिकाओं और प्रशासन के कामकाज का अनुभव तथा भारत शासन अधिनियम, 1935 से अनेक संस्थागत विवरण और प्रक्रियाएँ।',
      },
      {
        en: 'Constituent Assembly deliberation and scrutiny.',
        hi: 'संविधान सभा का विचार-विमर्श: विदेशी और भारतीय अनुभवों की जाँच, बहस और भारतीय परिस्थितियों के अनुसार अनुकूलन।',
      },
      {
        en: 'Selected foreign constitutional traditions adapted to Indian needs.',
        hi: 'विदेशी संवैधानिक परंपराएँ: उपयोगी विशेषताएँ चुनी गईं, लेकिन उन्हें बिना बदलाव copy नहीं किया गया।',
      },
    ],
    goldenRule: {
      en: 'India learnt, tested and adapted; India did not copy blindly.',
      hi: 'भारत ने सीखा, परखा और अनुकूलित किया; अंधी नकल नहीं की।',
    },
  },
  sourceMap: {
    title: { en: 'Core Source Map', hi: 'Core Source Map' },
    rows: [
      {
        source: { en: 'Britain', hi: 'ब्रिटेन' },
        influence: {
          en: 'First Past the Post, Parliamentary Government, Rule of Law, Speaker and role, Law-making procedure',
          hi: 'First Past the Post, संसदीय शासन, Rule of Law, Speaker और भूमिका, विधि-निर्माण प्रक्रिया',
        },
        memory: {
          en: 'British Parliament में Speaker, Law और FPTP Rule',
          hi: 'British Parliament में Speaker, Law और FPTP Rule',
        },
      },
      {
        source: { en: 'United States', hi: 'संयुक्त राज्य अमेरिका' },
        influence: {
          en: 'Charter of Fundamental Rights, Judicial Review, Independence of Judiciary',
          hi: 'मौलिक अधिकारों का चार्टर, न्यायिक समीक्षा, न्यायपालिका की स्वतंत्रता',
        },
        memory: {
          en: 'USA = Rights reviewed by independent Judges',
          hi: 'USA = Rights reviewed by independent Judges',
        },
      },
      {
        source: { en: 'Ireland', hi: 'आयरलैंड' },
        influence: {
          en: 'Directive Principles of State Policy',
          hi: 'राज्य के नीति निदेशक तत्व',
        },
        memory: { en: 'Ireland gives Direction', hi: 'Ireland gives Direction' },
      },
      {
        source: { en: 'France', hi: 'फ्रांस' },
        influence: {
          en: 'Liberty, Equality and Fraternity',
          hi: 'स्वतंत्रता, समानता और बंधुता',
        },
        memory: { en: 'France = LEF', hi: 'France = LEF' },
      },
      {
        source: { en: 'Canada', hi: 'कनाडा' },
        influence: {
          en: 'Quasi-federal system with a strong Centre, Residuary Powers',
          hi: 'मजबूत केंद्र वाला अर्ध-संघात्मक ढाँचा, अवशिष्ट शक्तियाँ',
        },
        memory: {
          en: 'Canada = Centre + बची powers',
          hi: 'Canada = Centre + बची powers',
        },
      },
    ],
    caution: {
      en: 'Do not extend this verified NCERT table through guesswork. A popular coaching association is not evidence unless the cited official material expressly supports it.',
      hi: 'सत्यापित NCERT सारणी से आगे अनुमान न लगाएँ। किसी coaching mapping को official evidence के बिना fact न मानें।',
    },
  },
  capsules: [
    {
      id: 'britain',
      title: { en: 'Britain', hi: 'ब्रिटेन' },
      influences: [
        { en: 'First Past the Post', hi: 'First Past the Post' },
        { en: 'Parliamentary form of government', hi: 'संसदीय शासन प्रणाली' },
        { en: 'Rule of law', hi: 'विधि का शासन' },
        { en: 'Institution of the Speaker and the Speaker’s role', hi: 'Speaker की संस्था और भूमिका' },
        { en: 'Law-making procedure', hi: 'विधि-निर्माण प्रक्रिया' },
      ],
      memory: {
        en: 'British Parliament में Speaker ने Law बनाकर FPTP से Rule किया.',
        hi: 'British Parliament में Speaker ने Law बनाकर FPTP से Rule किया.',
      },
      alerts: [
        {
          en: 'Judicial review belongs with the United States, not Britain.',
          hi: 'न्यायिक समीक्षा संयुक्त राज्य अमेरिका से जुड़ी है, ब्रिटेन से नहीं।',
        },
        {
          en: 'Residuary powers belong with Canada, not Britain.',
          hi: 'अवशिष्ट शक्तियाँ कनाडा से जुड़ी हैं, ब्रिटेन से नहीं।',
        },
        {
          en: 'Inspiration and the current controlling Indian provision are different question types.',
          hi: 'प्रेरणा-स्रोत और वर्तमान भारतीय प्रावधान अलग प्रश्न-प्रकार हैं।',
        },
      ],
      anchors: {
        en: 'Current Indian anchors: Articles 74–75, Article 93 and Articles 107–111.',
        hi: 'वर्तमान भारतीय आधार: अनुच्छेद 74–75, अनुच्छेद 93 और अनुच्छेद 107–111।',
      },
    },
    {
      id: 'usa',
      title: { en: 'United States', hi: 'संयुक्त राज्य अमेरिका' },
      influences: [
        { en: 'Charter of Fundamental Rights', hi: 'मौलिक अधिकारों का चार्टर' },
        { en: 'Power of Judicial Review', hi: 'न्यायिक समीक्षा की शक्ति' },
        { en: 'Independence of the Judiciary', hi: 'न्यायपालिका की स्वतंत्रता' },
      ],
      memory: {
        en: 'US Rights को Independent Judges Review करते हैं.',
        hi: 'US Rights को Independent Judges Review करते हैं.',
      },
      alerts: [
        {
          en: 'Directive Principles belong with Ireland, not the United States.',
          hi: 'नीति निदेशक तत्व आयरलैंड से जुड़े हैं, संयुक्त राज्य से नहीं।',
        },
        {
          en: 'Fundamental Rights are currently governed by Part III of the Indian Constitution.',
          hi: 'मौलिक अधिकार वर्तमान में भारतीय संविधान के भाग III में हैं।',
        },
        {
          en: 'The source of inspiration and the Indian constitutional basis of judicial review are different questions.',
          hi: 'प्रेरणा-स्रोत और न्यायिक समीक्षा का भारतीय संवैधानिक आधार अलग प्रश्न हैं।',
        },
      ],
      anchors: {
        en: 'Current Indian anchors: Part III and important remedial jurisdictions under Articles 32 and 226.',
        hi: 'वर्तमान भारतीय आधार: भाग III तथा अनुच्छेद 32 और 226 की उपचार अधिकारिता।',
      },
    },
    {
      id: 'ireland',
      title: { en: 'Ireland', hi: 'आयरलैंड' },
      influences: [
        { en: 'Directive Principles of State Policy', hi: 'राज्य के नीति निदेशक तत्व' },
      ],
      memory: { en: 'IRELAND gives DIRECTION.', hi: 'IRELAND gives DIRECTION.' },
      alerts: [
        { en: 'Fundamental Rights are in Part III.', hi: 'मौलिक अधिकार भाग III में हैं।' },
        { en: 'Directive Principles are in Part IV.', hi: 'नीति निदेशक तत्व भाग IV में हैं।' },
        {
          en: 'Article 37 makes Directive Principles non-justiciable while describing them as fundamental in governance.',
          hi: 'अनुच्छेद 37 नीति निदेशक तत्वों को गैर-न्याययोग्य बनाता है, पर शासन में उन्हें मौलिक बताता है।',
        },
      ],
      anchors: {
        en: 'Current Indian anchors: Part IV and Article 37.',
        hi: 'वर्तमान भारतीय आधार: भाग IV और अनुच्छेद 37।',
      },
    },
    {
      id: 'france',
      title: { en: 'France', hi: 'फ्रांस' },
      influences: [
        { en: 'Liberty', hi: 'स्वतंत्रता' },
        { en: 'Equality', hi: 'समानता' },
        { en: 'Fraternity', hi: 'बंधुता' },
      ],
      memory: {
        en: 'France = LEF: Liberty, Equality, Fraternity.',
        hi: 'फ्रांस ने स्वतंत्रता–समानता–बंधुता की तिकड़ी याद दिलाई.',
      },
      alerts: [
        { en: 'These ideals are associated with France.', hi: 'ये आदर्श फ्रांस से जुड़े हैं।' },
        {
          en: 'Their controlling Indian text is the Preamble.',
          hi: 'इनका वर्तमान भारतीय पाठ प्रस्तावना है।',
        },
        {
          en: 'Do not associate France with residuary powers or Directive Principles.',
          hi: 'फ्रांस को अवशिष्ट शक्तियों या नीति निदेशक तत्वों से न जोड़ें।',
        },
      ],
      anchors: {
        en: 'Current Indian anchor: Preamble.',
        hi: 'वर्तमान भारतीय आधार: प्रस्तावना।',
      },
    },
    {
      id: 'canada',
      title: { en: 'Canada', hi: 'कनाडा' },
      influences: [
        {
          en: 'Quasi-federal form with a strong central government',
          hi: 'मजबूत केंद्र वाला अर्ध-संघात्मक रूप',
        },
        { en: 'Residuary powers', hi: 'अवशिष्ट शक्तियाँ' },
      ],
      memory: {
        en: 'Canada = Centre strong + बची powers Centre की.',
        hi: 'Canada = Centre strong + बची powers Centre की.',
      },
      alerts: [
        {
          en: 'Parliamentary government belongs with Britain, not Canada.',
          hi: 'संसदीय शासन ब्रिटेन से जुड़ा है, कनाडा से नहीं।',
        },
        {
          en: 'The current Indian residuary-power rule is anchored in Article 248 and Union List Entry 97.',
          hi: 'वर्तमान भारतीय अवशिष्ट शक्ति नियम अनुच्छेद 248 और संघ सूची प्रविष्टि 97 में है।',
        },
        {
          en: 'Do not confuse historical inspiration with present legal operation.',
          hi: 'ऐतिहासिक प्रेरणा को वर्तमान कानूनी संचालन से भ्रमित न करें।',
        },
      ],
      anchors: {
        en: 'Current Indian anchors: Article 248 and Union List Entry 97.',
        hi: 'वर्तमान भारतीय आधार: अनुच्छेद 248 और संघ सूची प्रविष्टि 97।',
      },
    },
  ],
  indianSources: {
    title: { en: 'Indian and Historical Sources', hi: 'भारतीय और ऐतिहासिक स्रोत' },
    blocks: [
      {
        title: { en: 'National movement', hi: 'राष्ट्रीय आंदोलन' },
        body: {
          en: 'Before the Constituent Assembly met, many ideas about democratic India had developed through the freedom struggle. The Constitution was therefore not created suddenly inside the Assembly.',
          hi: 'संविधान सभा के बैठने से पहले ही स्वतंत्रता संग्राम के माध्यम से लोकतांत्रिक भारत के कई विचार विकसित हो चुके थे। इसलिए संविधान अचानक सभा के अंदर नहीं बना।',
        },
      },
      {
        title: { en: '1928 constitutional draft', hi: '1928 का संवैधानिक मसौदा' },
        body: {
          en: 'NCERT identifies Motilal Nehru and eight other Congress leaders with a 1928 constitutional draft for India.',
          hi: 'NCERT 1928 के भारतीय संवैधानिक मसौदे को मोतीलाल नेहरू और आठ अन्य कांग्रेस नेताओं से जोड़ता है।',
        },
      },
      {
        title: { en: '1931 Karachi Resolution', hi: '1931 का कराची प्रस्ताव' },
        body: {
          en: 'The resolution discussed the intended constitutional character of independent India. The 1928 draft and the Karachi Resolution shared commitments including universal adult franchise, freedom, equality and protection of minority rights.',
          hi: 'इस प्रस्ताव में स्वतंत्र भारत के अपेक्षित संवैधानिक स्वरूप पर चर्चा हुई। 1928 मसौदे और कराची प्रस्ताव में वयस्क मताधिकार, स्वतंत्रता, समानता और अल्पसंख्यक अधिकारों की सुरक्षा जैसी प्रतिबद्धताएँ साझा थीं।',
        },
      },
      {
        title: { en: 'Colonial institutional experience', hi: 'औपनिवेशिक संस्थागत अनुभव' },
        body: {
          en: 'Colonial legislatures were not fully democratic, but experience gained in their operation helped Indians establish their own institutions. NCERT identifies the Government of India Act, 1935 as an example connected with many institutional details and procedures.',
          hi: 'औपनिवेशिक विधायिकाएँ पूर्णतः लोकतांत्रिक नहीं थीं, पर उनके संचालन का अनुभव भारतीयों को अपनी संस्थाएँ बनाने में सहायक बना। NCERT भारत शासन अधिनियम, 1935 को अनेक संस्थागत विवरणों और प्रक्रियाओं से जोड़ता है।',
        },
      },
      {
        title: { en: 'Constituent Assembly', hi: 'संविधान सभा' },
        body: {
          en: 'Formal constitution-making body: Constituent Assembly. Drafting Committee Chairman: Dr. B. R. Ambedkar. Working method: systematic, open and consensual. The Draft Constitution was discussed clause by clause; more than two thousand amendments were considered. Constituent Assembly Debates preserve historical reasoning relevant to interpretation.',
          hi: 'औपचारिक संविधान-निर्माण निकाय: संविधान सभा। प्रारूप समिति के अध्यक्ष: डॉ. बी. आर. अम्बेडकर। कार्यविधि: व्यवस्थित, खुली और सहमतिपरक। मसौदा संविधान खंड-दर-खंड चर्चा हुआ; दो हज़ार से अधिक संशोधनों पर विचार हुआ। संविधान सभा की बहसें व्याख्या के लिए ऐतिहासिक तर्क सुरक्षित रखती हैं।',
        },
      },
    ],
    timeline: {
      title: { en: 'Timeline trick', hi: 'Timeline trick' },
      line: {
        en: '28 Draft → 31 Karachi → 35 Institutional Act → 46 Assembly → 49 Adopt → 50 Enforce',
        hi: '28 Draft → 31 Karachi → 35 Institutional Act → 46 Assembly → 49 Adopt → 50 Enforce',
      },
      markers: [
        { marker: '28', meaning: { en: 'Motilal Nehru-led constitutional draft', hi: 'मोतीलाल नेहरू-नेतृत्व वाला संवैधानिक मसौदा' } },
        { marker: '31', meaning: { en: 'Karachi Resolution', hi: 'कराची प्रस्ताव' } },
        {
          marker: '35',
          meaning: {
            en: 'Government of India Act, 1935 and institutional experience',
            hi: 'भारत शासन अधिनियम, 1935 और संस्थागत अनुभव',
          },
        },
        { marker: '46', meaning: { en: 'Constituent Assembly’s first meeting year', hi: 'संविधान सभा की पहली बैठक का वर्ष' } },
        { marker: '49', meaning: { en: 'Constitution adopted on 26 November 1949', hi: '26 नवंबर 1949 को संविधान अंगीकृत' } },
        { marker: '50', meaning: { en: 'Constitution came into force on 26 January 1950', hi: '26 जनवरी 1950 को संविधान लागू' } },
      ],
    },
  },
  confusion: {
    title: { en: 'High-Risk Confusion Table', hi: 'High-Risk Confusion Table' },
    rows: [
      { signal: { en: 'Parliamentary government', hi: 'संसदीय शासन' }, correct: { en: 'Britain', hi: 'ब्रिटेन' }, trap: { en: 'Canada', hi: 'कनाडा' } },
      { signal: { en: 'Rule of law', hi: 'विधि का शासन' }, correct: { en: 'Britain', hi: 'ब्रिटेन' }, trap: { en: 'United States', hi: 'संयुक्त राज्य' } },
      { signal: { en: 'Judicial review', hi: 'न्यायिक समीक्षा' }, correct: { en: 'United States', hi: 'संयुक्त राज्य' }, trap: { en: 'Britain', hi: 'ब्रिटेन' } },
      { signal: { en: 'Judicial independence', hi: 'न्यायिक स्वतंत्रता' }, correct: { en: 'United States', hi: 'संयुक्त राज्य' }, trap: { en: 'Ireland', hi: 'आयरलैंड' } },
      { signal: { en: 'Directive Principles', hi: 'नीति निदेशक तत्व' }, correct: { en: 'Ireland', hi: 'आयरलैंड' }, trap: { en: 'United States', hi: 'संयुक्त राज्य' } },
      { signal: { en: 'Liberty–Equality–Fraternity', hi: 'स्वतंत्रता–समानता–बंधुता' }, correct: { en: 'France', hi: 'फ्रांस' }, trap: { en: 'Britain', hi: 'ब्रिटेन' } },
      { signal: { en: 'Strong Centre + quasi-federal', hi: 'मजबूत केंद्र + अर्ध-संघात्मक' }, correct: { en: 'Canada', hi: 'कनाडा' }, trap: { en: 'Britain', hi: 'ब्रिटेन' } },
      { signal: { en: 'Residuary powers', hi: 'अवशिष्ट शक्तियाँ' }, correct: { en: 'Canada', hi: 'कनाडा' }, trap: { en: 'United States', hi: 'संयुक्त राज्य' } },
      {
        signal: { en: 'Institutional details/procedures', hi: 'संस्थागत विवरण/प्रक्रियाएँ' },
        correct: { en: 'Colonial experience and GOI Act, 1935', hi: 'औपनिवेशिक अनुभव और GOI Act, 1935' },
        trap: { en: 'Calling it the sole source', hi: 'इसे एकमात्र स्रोत मानना' },
      },
      {
        signal: { en: '“Copied Constitution”', hi: '“नकल किया संविधान”' },
        correct: {
          en: 'Incorrect framing; the correct idea is selection, scrutiny and adaptation',
          hi: 'गलत framing; सही विचार है चयन, जाँच और अनुकूलन',
        },
        trap: { en: 'Treating borrowing as unchanged copying', hi: 'उधार को बिना बदलाव नकल मानना' },
      },
    ],
  },
  examRules: {
    title: { en: 'Five Exam Rules', hi: 'पाँच Exam Rules' },
    rules: [
      {
        en: 'Keep the source of inspiration separate from the current Indian provision.',
        hi: 'प्रेरणा-स्रोत को वर्तमान भारतीय प्रावधान से अलग रखें।',
      },
      {
        en: 'Treat exclusive words such as only, entirely, unchanged and blindly copied as warning signals.',
        hi: 'only, entirely, unchanged और blindly copied जैसे शब्दों को चेतावनी संकेत मानें।',
      },
      {
        en: 'Remember the clusters: Britain 5, United States 3, Ireland 1, France 3 ideals, Canada 2.',
        hi: 'क्लस्टर याद रखें: Britain 5, United States 3, Ireland 1, France 3 ideals, Canada 2।',
      },
      {
        en: 'Do not extrapolate beyond the verified source table.',
        hi: 'सत्यापित स्रोत सारणी से आगे extrapolation न करें।',
      },
      {
        en: 'Always include the Indian streams: nationalist values, colonial experience, Assembly deliberation and adapted foreign ideas.',
        hi: 'हमेशा भारतीय धाराएँ शामिल करें: राष्ट्रीय मूल्य, औपनिवेशिक अनुभव, सभा का विमर्श और अनुकूलित विदेशी विचार।',
      },
    ],
  },
  mindmap: {
    title: { en: 'Visual Mindmap', hi: 'Visual Mindmap' },
    root: {
      id: 'root',
      label: { en: 'Sources of Indian Constitution', hi: 'भारतीय संविधान के स्रोत' },
      children: [
        {
          id: 'indian',
          label: { en: 'Indian foundations', hi: 'भारतीय नींव' },
          children: [
            { id: 'freedom', label: { en: 'Freedom struggle', hi: 'स्वतंत्रता संग्राम' } },
            { id: 'draft-1928', label: { en: '1928 constitutional draft', hi: '1928 संवैधानिक मसौदा' } },
            { id: 'karachi', label: { en: '1931 Karachi Resolution', hi: '1931 कराची प्रस्ताव' } },
            { id: 'assembly', label: { en: 'Constituent Assembly deliberation', hi: 'संविधान सभा का विचार-विमर्श' } },
          ],
        },
        {
          id: 'colonial',
          label: { en: 'Colonial experience', hi: 'औपनिवेशिक अनुभव' },
          children: [
            { id: 'legislative', label: { en: 'Legislative experience', hi: 'विधायी अनुभव' } },
            { id: 'goi-1935', label: { en: 'Government of India Act, 1935', hi: 'भारत शासन अधिनियम, 1935' } },
            { id: 'procedures', label: { en: 'Institutional details and procedures', hi: 'संस्थागत विवरण और प्रक्रियाएँ' } },
          ],
        },
        {
          id: 'foreign',
          label: { en: 'Foreign traditions', hi: 'विदेशी परंपराएँ' },
          children: [
            {
              id: 'britain-node',
              label: { en: 'Britain', hi: 'ब्रिटेन' },
              children: [
                { id: 'fptp', label: { en: 'FPTP', hi: 'FPTP' } },
                { id: 'parliamentary', label: { en: 'Parliamentary government', hi: 'संसदीय शासन' } },
                { id: 'rule-of-law', label: { en: 'Rule of law', hi: 'विधि का शासन' } },
                { id: 'speaker', label: { en: 'Speaker', hi: 'Speaker' } },
                { id: 'law-making', label: { en: 'Law-making procedure', hi: 'विधि-निर्माण प्रक्रिया' } },
              ],
            },
            {
              id: 'usa-node',
              label: { en: 'United States', hi: 'संयुक्त राज्य' },
              children: [
                { id: 'fr', label: { en: 'Fundamental Rights', hi: 'मौलिक अधिकार' } },
                { id: 'jr', label: { en: 'Judicial review', hi: 'न्यायिक समीक्षा' } },
                { id: 'ji', label: { en: 'Judicial independence', hi: 'न्यायिक स्वतंत्रता' } },
              ],
            },
            {
              id: 'ireland-node',
              label: { en: 'Ireland', hi: 'आयरलैंड' },
              children: [{ id: 'dpsp', label: { en: 'Directive Principles', hi: 'नीति निदेशक तत्व' } }],
            },
            {
              id: 'france-node',
              label: { en: 'France', hi: 'फ्रांस' },
              children: [
                { id: 'liberty', label: { en: 'Liberty', hi: 'स्वतंत्रता' } },
                { id: 'equality', label: { en: 'Equality', hi: 'समानता' } },
                { id: 'fraternity', label: { en: 'Fraternity', hi: 'बंधुता' } },
              ],
            },
            {
              id: 'canada-node',
              label: { en: 'Canada', hi: 'कनाडा' },
              children: [
                { id: 'quasi', label: { en: 'Strong-Centre quasi-federalism', hi: 'मजबूत-केंद्र अर्ध-संघवाद' } },
                { id: 'residuary', label: { en: 'Residuary powers', hi: 'अवशिष्ट शक्तियाँ' } },
              ],
            },
          ],
        },
        {
          id: 'adapt',
          label: { en: 'Indian adaptation', hi: 'भारतीय अनुकूलन' },
          children: [
            { id: 'compare', label: { en: 'Compare', hi: 'तुलना' } },
            { id: 'test', label: { en: 'Test suitability', hi: 'उपयुक्तता जाँच' } },
            { id: 'debate', label: { en: 'Debate', hi: 'बहस' } },
            { id: 'adapt-node', label: { en: 'Adapt', hi: 'अनुकूलन' } },
          ],
        },
      ],
    } as MindmapNode,
  },
  sources: [
    {
      id: 'ncert-ix',
      title: {
        en: 'NCERT — Democratic Politics-I, Class IX',
        hi: 'NCERT — Democratic Politics-I, Class IX',
      },
      chapter: {
        en: 'Chapter 2: Constitutional Design',
        hi: 'अध्याय 2: Constitutional Design',
      },
      edition: { en: 'Reprint 2025–26', hi: 'Reprint 2025–26' },
      locator: { en: 'Printed pages 23–25', hi: 'मुद्रित पृष्ठ 23–25' },
      url: 'https://ncert.nic.in/textbook/pdf/iess402.pdf',
      buttonLabel: { en: 'Open Official NCERT PDF', hi: 'आधिकारिक NCERT PDF खोलें' },
      verificationDate: { en: '13 July 2026', hi: '13 जुलाई 2026' },
      accessibleName: {
        en: 'Open official NCERT PDF for Democratic Politics-I Class IX in a new tab',
        hi: 'Democratic Politics-I Class IX का आधिकारिक NCERT PDF नए टैब में खोलें',
      },
    },
    {
      id: 'ncert-xi',
      title: {
        en: 'NCERT — Indian Constitution at Work, Class XI',
        hi: 'NCERT — Indian Constitution at Work, Class XI',
      },
      chapter: {
        en: 'Chapter 1: Constitution: Why and How?',
        hi: 'अध्याय 1: Constitution: Why and How?',
      },
      edition: { en: 'Reprint 2026–27', hi: 'Reprint 2026–27' },
      locator: { en: 'Printed pages 19–22', hi: 'मुद्रित पृष्ठ 19–22' },
      url: 'https://ncert.nic.in/textbook/pdf/keps201.pdf',
      buttonLabel: { en: 'Open Official NCERT PDF', hi: 'आधिकारिक NCERT PDF खोलें' },
      verificationDate: { en: '13 July 2026', hi: '13 जुलाई 2026' },
      accessibleName: {
        en: 'Open official NCERT PDF for Indian Constitution at Work Class XI in a new tab',
        hi: 'Indian Constitution at Work Class XI का आधिकारिक NCERT PDF नए टैब में खोलें',
      },
    },
    {
      id: 'constitution-pdf',
      title: {
        en: 'Government of India, Legislative Department — Constitution of India',
        hi: 'भारत सरकार, विधायी विभाग — भारत का संविधान',
      },
      edition: {
        en: 'Diglot edition, as on 1 May 2026',
        hi: 'द्विभाषी संस्करण, 1 मई 2026 तक',
      },
      locator: {
        en: 'Preamble; Parts III and IV; Articles 32, 37, 74–75, 93, 107–111, 226 and 248; Seventh Schedule',
        hi: 'प्रस्तावना; भाग III और IV; अनुच्छेद 32, 37, 74–75, 93, 107–111, 226 और 248; सातवीं अनुसूची',
      },
      url: 'https://www.legislative.gov.in/static/uploads/2025/07/76b9f1c47176fc65accc160f19c982b7.pdf',
      buttonLabel: { en: 'Open Official Constitution PDF', hi: 'आधिकारिक संविधान PDF खोलें' },
      verificationDate: { en: '13 July 2026', hi: '13 जुलाई 2026' },
      accessibleName: {
        en: 'Open official Constitution of India PDF in a new tab',
        hi: 'भारत के संविधान का आधिकारिक PDF नए टैब में खोलें',
      },
    },
  ] satisfies RevisionSourceCard[],
} as const;

export type SourcesRevisionContent = typeof sourcesRevisionContent;
