import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const CHEMISTRY_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Matter and Its States | पदार्थ और उसकी अवस्थाएँ',
    subtopics: [
      'Solid, Liquid and Gas | ठोस, द्रव और गैस',
      'Change of State | अवस्था परिवर्तन',
      'Plasma and Bose–Einstein Condensate (Basics) | प्लाज़्मा और बोज़–आइंस्टीन संघनन (मूलभूत)',
      'Physical and Chemical Changes | भौतिक और रासायनिक परिवर्तन',
    ],
  },
  {
    id: 2,
    title: 'Atomic Structure | परमाणु संरचना',
    note: 'Covers atomic structure from the chemistry perspective (atomic number, mass number, valence electrons and electron arrangement). Nuclear and modern physics concepts belong to Physics (Topic 1.14). | रसायन विज्ञान के दृष्टिकोण से परमाणु संरचना (परमाणु क्रमांक, द्रव्यमान संख्या, संयोजक इलेक्ट्रॉन और इलेक्ट्रॉन व्यवस्था) को कवर करता है। नाभिकीय और आधुनिक भौतिकी की अवधारणाएँ भौतिकी (विषय 1.14) में आती हैं।',
    subtopics: [
      'Atom | परमाणु',
      'Proton, Neutron and Electron | प्रोटॉन, न्यूट्रॉन और इलेक्ट्रॉन',
      'Atomic Number and Mass Number | परमाणु क्रमांक और द्रव्यमान संख्या',
      'Electron Arrangement and Valence Electrons | इलेक्ट्रॉन व्यवस्था और संयोजक इलेक्ट्रॉन',
    ],
  },
  {
    id: 3,
    title: 'Elements, Compounds and Mixtures | तत्व, यौगिक और मिश्रण',
    subtopics: [
      'Elements | तत्व',
      'Compounds | यौगिक',
      'Homogeneous Mixtures | समांगी मिश्रण',
      'Heterogeneous Mixtures | विषमांगी मिश्रण',
    ],
  },
  {
    id: 4,
    title: 'Periodic Table | आवर्त सारणी',
    subtopics: [
      'Groups and Periods | समूह और आवर्त',
      'Metals, Non-metals and Metalloids | धातु, अधातु और उपधातु',
      'Periodic Trends | आवर्त प्रवृत्तियाँ',
      'Important Elements and Their Uses | महत्वपूर्ण तत्व और उनके उपयोग',
    ],
  },
  {
    id: 5,
    title: 'Chemical Bonding | रासायनिक बंधन',
    subtopics: [
      'Ionic Bond | आयनिक बंध',
      'Covalent Bond | सहसंयोजक बंध',
      'Metallic Bond | धात्विक बंध',
      'Valency | संयोजकता',
    ],
  },
  {
    id: 6,
    title: 'Chemical Reactions | रासायनिक अभिक्रियाएँ',
    subtopics: [
      'Combination and Decomposition Reactions | संयोजन और अपघटन अभिक्रियाएँ',
      'Displacement and Double Displacement Reactions | विस्थापन और द्विविस्थापन अभिक्रियाएँ',
      'Oxidation and Reduction (Redox) | ऑक्सीकरण और अपचयन (रेडॉक्स)',
      'Balancing of Chemical Equations | रासायनिक समीकरणों का संतुलन',
    ],
  },
  {
    id: 7,
    title: 'Acids, Bases and Salts | अम्ल, क्षार और लवण',
    subtopics: [
      'Acids and Bases | अम्ल और क्षार',
      'pH Scale | pH स्केल',
      'Neutralisation | उदासीनीकरण',
      'Important Salts and Their Uses | महत्वपूर्ण लवण और उनके उपयोग',
    ],
  },
  {
    id: 8,
    title: 'Metals and Non-Metals | धातु और अधातु',
    subtopics: [
      'Physical Properties | भौतिक गुण',
      'Chemical Properties | रासायनिक गुण',
      'Reactivity Series | अभिक्रियाशीलता श्रेणी',
      'Corrosion and Prevention | संक्षार और उसकी रोकथाम',
    ],
  },
  {
    id: 9,
    title: 'Carbon and Organic Chemistry Basics | कार्बन और कार्बनिक रसायन के मूलभूत सिद्धांत',
    subtopics: [
      'Carbon Bonding | कार्बन बंधन',
      'Hydrocarbons (Alkanes, Alkenes and Alkynes) | हाइड्रोकार्बन (एल्केन, एल्कीन और एल्काइन)',
      'Functional Groups | कार्यात्मक समूह',
      'Alcohols and Carboxylic Acids | अल्कोहल और कार्बoksilk अम्ल',
      'Polymers and Plastics | बहुलक और प्लास्टिक',
      'Soaps and Detergents | साबुन और डिटर्जेंट',
    ],
  },
  {
    id: 10,
    title: 'Environmental Chemistry | पर्यावरण रसायन',
    note: 'Covers only the chemical aspects of pollutants and atmospheric reactions. Environmental impact, conservation, climate change and pollution management belong to Environment & Ecology. | केवल प्रदूषकों और वायुमंडलीय अभिक्रियाओं के रासायनिक पहलुओं को कवर करता है। पर्यावरणीय प्रभाव, संरक्षण, जलवायु परिवर्तन और प्रदूषण प्रबंधन पर्यावरण और पारिस्थितिकी में आते हैं।',
    subtopics: [
      'Air Pollutants | वायु प्रदूषक',
      'Water Pollutants | जल प्रदूषक',
      'Greenhouse Gases | ग्रीनहाउस गैases',
      'Ozone Layer and CFC Chemistry | ओज़ोन परत और CFC रसायन',
    ],
  },
  {
    id: 11,
    title: 'Chemistry in Everyday Life | दैनिक जीवन में रसायन',
    subtopics: [
      'Medicines | दवाइयाँ',
      'Fertilisers | उर्वरक',
      'Pesticides | कीटनाशक',
      'Food Preservatives | खाद्य संरक्षक',
      'Household Chemicals | घरेलू रसायन',
    ],
  },
  {
    id: 12,
    title: 'Nuclear Chemistry | नाभिकीय रसायन',
    note: 'Covers isotopes, radioactive decay and applications of radioisotopes. Nuclear fission, fusion and atomic physics concepts belong to Physics (Topic 1.14). | समस्थानिक, रेडियोधर्मी क्षय और रेडियो-समस्थानिकों के अनुप्रयोगों को कवर करता है। नाभिकीय विखंडन, संलयन और परमाणु भौतिकी की अवधारणाएँ भौतिकी (विषय 1.14) में आती हैं।',
    subtopics: [
      'Radioactive Elements | रेडियोधर्मी तत्व',
      'Isotopes and Isobars | समस्थानिक और समभारिक',
      'Radioactive Decay (Alpha, Beta and Gamma) | रेडियोधर्मी क्षय (अल्फा, बीटा और गामा)',
      'Half-life | अर्ध-आयु',
      'Applications of Radioisotopes | रेडियो-समस्थानिकों के अनुप्रयोग',
    ],
  },
];

export const CHEMISTRY_PAGE_TITLE = {
  en: 'Chemistry',
  hi: 'रसायन विज्ञान',
};

export const CHEMISTRY_SECTION_LABEL = {
  en: 'Chemistry Topics',
  hi: 'रसायन विज्ञान के विषय',
};

export const CHEMISTRY_SCOPE = {
  en: 'Matter, atoms, elements, compounds, chemical reactions and chemistry in daily life.',
  hi: 'पदार्थ, परमाणु, तत्व, यौगिक, रासायनिक अभिक्रियाएँ और दैनिक जीवन में रसायन विज्ञान।',
};
