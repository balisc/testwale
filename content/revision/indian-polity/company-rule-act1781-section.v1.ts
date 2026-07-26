/**
 * Section 04 — Act of Settlement, 1781
 * Version: indian-polity/constitutional-history-making/company-rule-act1781-section.v1
 */
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';

export type { BiString };

export type KeyCorrectionIcon =
  | 'document'
  | 'executive'
  | 'seal'
  | 'revenue'
  | 'boundary'
  | 'manuscript'
  | 'courthouse'
  | 'appeal'
  | 'regulation';

export const actOfSettlement1781Section = {
  chapterNumber: '02',
  year: '1781',
  title: {
    en: 'Judicial conflict is corrected',
    hi: 'न्यायिक टकराव का सुधार',
  },
  actName: {
    en: 'Act of Settlement, 1781',
    hi: 'एक्ट ऑफ सेटलमेंट, 1781',
  },
  secondaryLabel: {
    en: 'Also known as the Amending or Declaratory Act',
    hi: 'इसे संशोधन या घोषणात्मक अधिनियम भी कहा जाता है',
  },
  identityBadge: {
    en: 'Jurisdiction clarified',
    hi: 'अधिकार-क्षेत्र स्पष्ट किया गया',
  },
  markRevised: { en: 'Mark revised', hi: 'दोहराया गया चिह्नित करें' },
  revised: { en: 'Revised', hi: 'दोहराया गया' },
  signInToSave: {
    en: 'Sign in to save revision progress',
    hi: 'रिवीजन प्रगति सहेजने के लिए साइन इन करें',
  },

  whyNeeded: {
    heading: {
      en: 'Why was another Act needed after 1773?',
      hi: '1773 के बाद दूसरे अधिनियम की आवश्यकता क्यों पड़ी?',
    },
    text: {
      en: 'The Regulating Act provided for a Supreme Court, which was established at Calcutta in 1774. However, the limits of the Court’s jurisdiction were not sufficiently clear in practice. Conflicts arose with the Governor-General-in-Council, Company officials, revenue administration and the Company’s courts outside Calcutta. Parliament therefore intervened again to clarify judicial authority.',
      hi: 'रेगुलेटिंग एक्ट ने सुप्रीम कोर्ट का प्रावधान किया था और यह न्यायालय 1774 में कलकत्ता में स्थापित हुआ। लेकिन व्यवहार में न्यायालय के अधिकार-क्षेत्र की सीमाएँ पर्याप्त रूप से स्पष्ट नहीं थीं। गवर्नर-जनरल-इन-काउंसिल, कंपनी अधिकारियों, राजस्व प्रशासन और कलकत्ता से बाहर कंपनी की अदालतों के साथ टकराव उत्पन्न हुआ। इसलिए संसद ने न्यायिक अधिकारिता को स्पष्ट करने के लिए दोबारा हस्तक्षेप किया।',
    },
  },

  storyStrip: {
    stages: [
      {
        id: 'problem',
        label: { en: 'Problem', hi: 'समस्या' },
        text: {
          en: 'The Supreme Court’s practical reach was interpreted broadly.',
          hi: 'सुप्रीम कोर्ट की व्यावहारिक अधिकारिता की व्यापक व्याख्या हुई।',
        },
      },
      {
        id: 'conflict',
        label: { en: 'Conflict', hi: 'टकराव' },
        text: {
          en: 'Judicial process collided with revenue administration, official acts and Company courts.',
          hi: 'न्यायिक प्रक्रिया का राजस्व प्रशासन, सरकारी कार्यों और कंपनी की अदालतों से टकराव हुआ।',
        },
      },
      {
        id: 'correction',
        label: { en: 'Correction', hi: 'सुधार' },
        text: {
          en: 'The 1781 Act clarified boundaries and protected specified administrative functions.',
          hi: '1781 के अधिनियम ने सीमाएँ स्पष्ट कीं और निर्धारित प्रशासनिक कार्यों को संरक्षण दिया।',
        },
      },
    ],
  },

  keyCorrections: {
    heading: {
      en: 'Key corrections made by the Act',
      hi: 'अधिनियम द्वारा किए गए प्रमुख सुधार',
    },
    items: [
      {
        id: 'corrective-nature',
        icon: 'document' as const,
        text: {
          en: 'It amended and clarified the judicial-administration provisions associated with the Regulating Act, 1773.',
          hi: 'इसने रेगुलेटिंग एक्ट, 1773 से संबंधित न्यायिक-प्रशासनिक प्रावधानों में संशोधन और स्पष्टीकरण किया।',
        },
      },
      {
        id: 'public-acts',
        icon: 'executive' as const,
        text: {
          en: 'The Governor-General and Council were protected from the Supreme Court’s jurisdiction for acts done or ordered in their official public capacity within their authority.',
          hi: 'गवर्नर-जनरल और परिषद को अपने अधिकार के अंतर्गत सार्वजनिक पद की क्षमता में किए या आदेशित कार्यों के लिए सुप्रीम कोर्ट की अधिकारिता से संरक्षण दिया गया।',
        },
        qualifier: {
          en: 'This was protection for specified official acts, not unlimited personal immunity.',
          hi: 'यह निर्धारित सरकारी कार्यों का संरक्षण था, असीमित व्यक्तिगत प्रतिरक्षा नहीं।',
        },
      },
      {
        id: 'officials-authority',
        icon: 'seal' as const,
        text: {
          en: 'Persons acting under lawful official authority were protected from ordinary judicial interference for those authorised public acts.',
          hi: 'वैध सरकारी अधिकार के अंतर्गत कार्य करने वाले व्यक्तियों को उन अधिकृत सार्वजनिक कार्यों के लिए सामान्य न्यायिक हस्तक्षेप से संरक्षण मिला।',
        },
      },
      {
        id: 'revenue-matters',
        icon: 'revenue' as const,
        text: {
          en: 'The Supreme Court’s jurisdiction was excluded from revenue matters and acts connected with revenue collection when performed under the authorised administrative system.',
          hi: 'अधिकृत प्रशासनिक व्यवस्था के अंतर्गत किए गए राजस्व मामलों और राजस्व-संग्रह से जुड़े कार्यों को सुप्रीम कोर्ट की अधिकारिता से बाहर रखा गया।',
        },
      },
      {
        id: 'calcutta-jurisdiction',
        icon: 'boundary' as const,
        text: {
          en: 'The Supreme Court retained jurisdiction over persons within Calcutta, while its reach over Indians and administrative matters in the mofussil was narrowed and clarified.',
          hi: 'सुप्रीम कोर्ट की अधिकारिता कलकत्ता के भीतर व्यक्तियों पर बनी रही, जबकि मुफस्सिल में भारतीयों और प्रशासनिक मामलों पर उसकी पहुँच को सीमित और स्पष्ट किया गया।',
        },
      },
      {
        id: 'personal-laws',
        icon: 'manuscript' as const,
        text: {
          en: 'In relevant civil and family matters, the Court was required to respect the applicable laws and usages of Hindus and Muslims instead of automatically applying English rules.',
          hi: 'संबंधित दीवानी और पारिवारिक मामलों में न्यायालय को अंग्रेजी नियम स्वतः लागू करने के बजाय हिंदुओं और मुसलमानों के लागू विधि एवं प्रचलनों का सम्मान करना था।',
        },
      },
      {
        id: 'provincial-courts',
        icon: 'courthouse' as const,
        text: {
          en: 'The Company’s provincial judicial arrangements outside Calcutta received clearer recognition within the administrative system.',
          hi: 'कलकत्ता से बाहर कंपनी की प्रांतीय न्यायिक व्यवस्था को प्रशासनिक प्रणाली में अधिक स्पष्ट मान्यता मिली।',
        },
      },
      {
        id: 'appellate-route',
        icon: 'appeal' as const,
        text: {
          en: 'Appeals from the Company’s provincial civil courts were directed to the Governor-General-in-Council through the Sadar Diwani Adalat arrangement, rather than treating the Supreme Court as their regular appellate court.',
          hi: 'कंपनी की प्रांतीय दीवानी अदालतों की अपीलें सदर दीवानी अदालत की व्यवस्था के माध्यम से गवर्नर-जनरल-इन-काउंसिल के पास जाती थीं; सुप्रीम कोर्ट उनका नियमित अपीलीय न्यायालय नहीं था।',
        },
      },
      {
        id: 'provincial-regulations',
        icon: 'regulation' as const,
        text: {
          en: 'The Governor-General-in-Council was empowered to frame regulations for the Provincial Courts and Councils.',
          hi: 'गवर्नर-जनरल-इन-काउंसिल को प्रांतीय अदालतों और परिषदों के लिए विनियम बनाने की शक्ति दी गई।',
        },
      },
    ],
  },

  jurisdictionVisual: {
    heading: {
      en: 'Where did the Supreme Court’s authority operate?',
      hi: 'सुप्रीम कोर्ट की अधिकारिता कहाँ लागू होती थी?',
    },
    calcutta: {
      label: { en: 'Calcutta', hi: 'कलकत्ता' },
      points: [
        { en: 'Supreme Court', hi: 'सुप्रीम कोर्ट' },
        { en: 'Crown court jurisdiction', hi: 'क्राउन न्यायालय की अधिकारिता' },
        {
          en: 'Court jurisdiction retained within Calcutta',
          hi: 'कलकत्ता के भीतर न्यायालय की अधिकारिता बनी रही',
        },
      ],
    },
    mofussil: {
      label: {
        en: 'Mofussil • Areas outside Calcutta',
        hi: 'मुफस्सिल • कलकत्ता से बाहर के क्षेत्र',
      },
      points: [
        { en: 'Company’s provincial courts', hi: 'कंपनी की प्रांतीय अदालतें' },
        { en: 'Revenue administration', hi: 'राजस्व प्रशासन' },
        { en: 'Sadar Diwani Adalat appellate route', hi: 'सदर दीवानी अदालत का अपीलीय मार्ग' },
      ],
    },
    explanation: {
      en: 'The Act did not abolish the Supreme Court. It defined limits between the Crown’s Court at Calcutta and the Company’s administrative and judicial machinery outside it.',
      hi: 'अधिनियम ने सुप्रीम कोर्ट को समाप्त नहीं किया। इसने कलकत्ता में क्राउन के न्यायालय और उसके बाहर कंपनी की प्रशासनिक तथा न्यायिक व्यवस्था के बीच सीमाएँ स्पष्ट कीं।',
    },
  },

  beforeAfter: {
    heading: {
      en: '1773 problem versus 1781 correction',
      hi: '1773 की समस्या और 1781 का सुधार',
    },
    rows: [
      {
        id: 'supreme-court',
        aspect: { en: 'Supreme Court', hi: 'सुप्रीम कोर्ट' },
        after1773: {
          en: 'Court established in 1774, but jurisdictional conflicts emerged',
          hi: 'न्यायालय 1774 में स्थापित हुआ, लेकिन अधिकारिता संबंधी टकराव उत्पन्न हुए',
        },
        correction1781: {
          en: 'Jurisdiction was clarified and narrowed in specified areas',
          hi: 'निर्धारित क्षेत्रों में अधिकारिता स्पष्ट और सीमित की गई',
        },
      },
      {
        id: 'official-acts',
        aspect: { en: 'Official acts', hi: 'सरकारी कार्य' },
        after1773: {
          en: 'Court intervention produced conflict with administration',
          hi: 'न्यायालय के हस्तक्षेप से प्रशासन के साथ टकराव हुआ',
        },
        correction1781: {
          en: 'Specified public-capacity acts received protection',
          hi: 'निर्धारित सार्वजनिक सरकारी कार्यों को संरक्षण मिला',
        },
      },
      {
        id: 'revenue',
        aspect: { en: 'Revenue', hi: 'राजस्व' },
        after1773: {
          en: 'Revenue administration faced judicial interference',
          hi: 'राजस्व प्रशासन को न्यायिक हस्तक्षेप का सामना करना पड़ा',
        },
        correction1781: {
          en: 'Revenue matters were placed outside the Court’s jurisdiction',
          hi: 'राजस्व मामलों को न्यायालय की अधिकारिता से बाहर रखा गया',
        },
      },
      {
        id: 'mofussil-justice',
        aspect: { en: 'Mofussil justice', hi: 'मुफस्सिल न्याय' },
        after1773: {
          en: 'Crown Court and Company-court boundaries were disputed',
          hi: 'क्राउन न्यायालय और कंपनी अदालतों की सीमाएँ विवादित थीं',
        },
        correction1781: {
          en: 'Provincial Company courts and their appellate route were clarified',
          hi: 'प्रांतीय कंपनी अदालतों और उनके अपीलीय मार्ग को स्पष्ट किया गया',
        },
      },
      {
        id: 'personal-laws',
        aspect: { en: 'Personal laws', hi: 'व्यक्तिगत विधियाँ' },
        after1773: {
          en: 'Application of English law created uncertainty and conflict',
          hi: 'अंग्रेजी विधि के प्रयोग से अनिश्चितता और टकराव हुआ',
        },
        correction1781: {
          en: 'Applicable Hindu and Muslim laws and usages received statutory respect',
          hi: 'लागू हिंदू और मुस्लिम विधियों एवं प्रचलनों को वैधानिक सम्मान मिला',
        },
      },
    ],
  },

  judicialRoute: {
    heading: {
      en: 'Civil appeal route outside Calcutta',
      hi: 'कलकत्ता से बाहर दीवानी अपील का मार्ग',
    },
    steps: [
      {
        id: 'provincial',
        label: { en: 'Provincial civil courts', hi: 'प्रांतीय दीवानी अदालतें' },
      },
      {
        id: 'sadar',
        label: { en: 'Sadar Diwani Adalat', hi: 'सदर दीवानी अदालत' },
      },
      {
        id: 'council',
        label: { en: 'Governor-General-in-Council', hi: 'गवर्नर-जनरल-इन-काउंसिल' },
      },
    ],
    supremeCourtNote: {
      en: 'Supreme Court at Calcutta',
      hi: 'कलकत्ता का सुप्रीम कोर्ट',
    },
    note: {
      en: 'The Supreme Court was not made the regular appellate court for the Company’s provincial civil courts.',
      hi: 'सुप्रीम कोर्ट को कंपनी की प्रांतीय दीवानी अदालतों का नियमित अपीलीय न्यायालय नहीं बनाया गया।',
    },
  },

  personalLaw: {
    heading: {
      en: 'Recognition of personal laws and usages',
      hi: 'व्यक्तिगत विधियों और प्रचलनों की मान्यता',
    },
    text: {
      en: 'The corrective statute required the judicial system to respect the applicable laws and usages of Hindu and Muslim inhabitants in relevant matters. This limited the automatic displacement of local personal law by English legal rules.',
      hi: 'सुधारात्मक अधिनियम ने संबंधित मामलों में हिंदू और मुस्लिम निवासियों की लागू विधियों एवं प्रचलनों का सम्मान करना आवश्यक किया। इससे स्थानीय व्यक्तिगत विधि को अंग्रेजी कानूनी नियमों द्वारा स्वतः प्रतिस्थापित किए जाने पर सीमा लगी।',
    },
    subcards: {
      hindu: { en: 'Hindu laws and usages', hi: 'हिंदू विधि एवं प्रचलन' },
      muslim: { en: 'Muslim laws and usages', hi: 'मुस्लिम विधि एवं प्रचलन' },
    },
  },

  conflictDisclosure: {
    heading: {
      en: 'Conflicts that shaped the correction',
      hi: 'वे टकराव जिनसे सुधार की आवश्यकता बनी',
    },
    examples: [
      {
        id: 'patna',
        title: { en: 'Patna dispute', hi: 'पटना विवाद' },
        text: {
          en: 'The Patna litigation highlighted questions about the Supreme Court’s reach into the mofussil, the treatment of Company judicial proceedings and the applicable law for Indian parties.',
          hi: 'पटना विवाद ने मुफस्सिल में सुप्रीम कोर्ट की पहुँच, कंपनी की न्यायिक कार्यवाही और भारतीय पक्षों पर लागू विधि से जुड़े प्रश्नों को उजागर किया।',
        },
      },
      {
        id: 'cossijurah',
        title: { en: 'Cossijurah conflict', hi: 'कोस्सिजुराह संघर्ष' },
        text: {
          en: 'The attempt to enforce Supreme Court process outside Calcutta produced a direct confrontation with Company authorities and exposed the uncertainty over jurisdiction.',
          hi: 'कलकत्ता से बाहर सुप्रीम कोर्ट की प्रक्रिया लागू करने के प्रयास से कंपनी अधिकारियों के साथ सीधा टकराव हुआ और अधिकारिता की अनिश्चितता सामने आई।',
        },
      },
    ],
  },

  didNotDo: {
    heading: {
      en: 'What the 1781 Act did not do',
      hi: '1781 के अधिनियम ने क्या नहीं किया',
    },
    items: [
      {
        en: 'It did not establish the Supreme Court; the Court had been established in 1774.',
        hi: 'इसने सुप्रीम कोर्ट की स्थापना नहीं की; न्यायालय 1774 में स्थापित हो चुका था।',
      },
      {
        en: 'It did not abolish the Supreme Court.',
        hi: 'इसने सुप्रीम कोर्ट को समाप्त नहीं किया।',
      },
      {
        en: 'It did not create the Board of Control.',
        hi: 'इसने बोर्ड ऑफ कंट्रोल नहीं बनाया।',
      },
      {
        en: 'It did not create the office of Governor-General of India.',
        hi: 'इसने भारत के गवर्नर-जनरल का पद नहीं बनाया।',
      },
      {
        en: 'It did not end the Company’s trade monopoly.',
        hi: 'इसने कंपनी का व्यापारिक एकाधिकार समाप्त नहीं किया।',
      },
      {
        en: 'It did not end Company rule.',
        hi: 'इसने कंपनी शासन समाप्त नहीं किया।',
      },
      {
        en: 'It did not create a completely separate and modern judicial system.',
        hi: 'इसने पूर्णतः पृथक और आधुनिक न्यायिक व्यवस्था स्थापित नहीं की।',
      },
    ],
  },

  resultLimitation: {
    heading: {
      en: 'What changed after the correction?',
      hi: 'सुधार के बाद क्या बदला?',
    },
    text: {
      en: 'The Act reduced major areas of conflict by limiting the Supreme Court’s interference in revenue and specified official acts, clarifying the place of Company courts and respecting applicable personal laws. However, it was mainly a judicial and administrative correction. The broader question of political control over the Company remained and was addressed more directly in 1784.',
      hi: 'अधिनियम ने राजस्व और निर्धारित सरकारी कार्यों में सुप्रीम कोर्ट के हस्तक्षेप को सीमित करके, कंपनी की अदालतों की स्थिति स्पष्ट करके और लागू व्यक्तिगत विधियों का सम्मान करके टकराव के प्रमुख क्षेत्रों को कम किया। लेकिन यह मुख्यतः न्यायिक और प्रशासनिक सुधार था। कंपनी पर व्यापक राजनीतिक नियंत्रण का प्रश्न बना रहा, जिसे 1784 में अधिक प्रत्यक्ष रूप से संबोधित किया गया।',
    },
    bridge: {
      en: 'Judicial boundaries were corrected; political control came next.',
      hi: 'न्यायिक सीमाएँ सुधरीं; अगला चरण राजनीतिक नियंत्रण था।',
    },
  },

  advancedExam: {
    heading: { en: 'Advanced exam details', hi: 'उन्नत परीक्षा तथ्य' },
    items: [
      {
        en: 'Statutory citation: 21 Geo. III, c. 70',
        hi: 'वैधानिक संदर्भ: 21 Geo. III, c. 70',
      },
      {
        en: 'It amended the justice-related operation of the Regulating Act rather than replacing the entire 1773 framework.',
        hi: 'इसने 1773 की पूरी व्यवस्था को समाप्त करने के बजाय उससे संबंधित न्याय-प्रशासन के संचालन में संशोधन किया।',
      },
      {
        en: 'Its long title expressly concerned the administration of justice in Bengal and resistance to Supreme Court process.',
        hi: 'इसके दीर्घ शीर्षक में बंगाल में न्याय-प्रशासन और सुप्रीम कोर्ट की प्रक्रिया के प्रतिरोध का स्पष्ट उल्लेख था।',
      },
      {
        en: 'The Governor-General and Council’s protection concerned public-capacity acts, not every private or personal act.',
        hi: 'गवर्नर-जनरल और परिषद का संरक्षण सार्वजनिक पद की क्षमता वाले कार्यों से संबंधित था, प्रत्येक निजी कार्य से नहीं।',
      },
      {
        en: 'Revenue matters and authorised revenue-collection acts were excluded from the Supreme Court’s jurisdiction.',
        hi: 'राजस्व मामले और अधिकृत राजस्व-संग्रह कार्य सुप्रीम कोर्ट की अधिकारिता से बाहर किए गए।',
      },
      {
        en: 'The Governor-General-in-Council, not the Supreme Court, could frame regulations for Provincial Courts and Councils.',
        hi: 'प्रांतीय अदालतों और परिषदों के लिए विनियम बनाने की शक्ति गवर्नर-जनरल-इन-काउंसिल की थी, सुप्रीम कोर्ट की नहीं।',
      },
      {
        en: 'The statute reinforced the appellate role associated with the Sadar Diwani Adalat.',
        hi: 'इसने सदर दीवानी अदालत से संबंधित अपीलीय व्यवस्था को मजबूत किया।',
      },
      {
        en: 'Historical statute catalogues may use the short title East India Company Act 1780, while Indian constitutional-history and competitive-exam material commonly identifies this corrective measure as the Act of Settlement or Amending Act, 1781.',
        hi: 'ऐतिहासिक statute catalogues में East India Company Act 1780 नाम मिल सकता है, जबकि भारतीय संवैधानिक इतिहास और प्रतियोगी परीक्षाओं में इसे सामान्यतः Act of Settlement or Amending Act, 1781 कहा जाता है।',
      },
    ],
  },

  examTrap: {
    heading: { en: 'Exam Trap', hi: 'परीक्षा में भ्रम' },
    text: {
      en: '1773 provided for the Supreme Court, 1774 saw its establishment, and 1781 clarified its jurisdiction. The Board of Control belongs to Pitt’s India Act, 1784.',
      hi: '1773 में सुप्रीम कोर्ट का प्रावधान हुआ, 1774 में उसकी स्थापना हुई और 1781 में उसकी अधिकारिता स्पष्ट की गई। बोर्ड ऑफ कंट्रोल पिट्स इंडिया एक्ट, 1784 से संबंधित है।',
    },
  },

  memoryFormula: {
    heading: { en: 'Memory Formula', hi: 'याद रखने की ट्रिक' },
    formula: {
      en: '1781 = Court limits + Official acts protected + Revenue excluded + Personal laws respected + Provincial appeals to Council',
      hi: '1781 = न्यायालय की सीमा + सरकारी कार्यों का संरक्षण + राजस्व बाहर + व्यक्तिगत विधियों का सम्मान + प्रांतीय अपील परिषद के पास',
    },
  },

  quickRevisionStrip: {
    en: '1773: Regulation begins → 1774: Supreme Court established → Conflicts emerge → 1781: Jurisdiction corrected',
    hi: '1773: नियंत्रण शुरू → 1774: सुप्रीम कोर्ट स्थापित → टकराव उत्पन्न → 1781: अधिकारिता में सुधार',
  },

  nextAct: {
    label: { en: 'Next Act • 1784', hi: 'अगला अधिनियम • 1784' },
    title: {
      en: 'Pitt’s India Act: Political control becomes stronger',
      hi: 'पिट्स इंडिया एक्ट: राजनीतिक नियंत्रण हुआ मजबूत',
    },
    button: { en: 'Continue to 1784', hi: '1784 के अधिनियम पर जाएँ' },
    comingSoon: { en: 'Coming in the next chapter', hi: 'अगले अध्याय में उपलब्ध होगा' },
    targetId: 'pitts-india-act-1784',
  },

  chapterRailTitle: {
    en: 'Regulating Acts & Company Rule',
    hi: 'रेगुलेटिंग अधिनियम और कंपनी शासन',
  },
  chapterRailCurrent: { en: 'Current', hi: 'वर्तमान' },
  chapterRailUpcoming: { en: 'Upcoming', hi: 'आगामी' },
} as const;
