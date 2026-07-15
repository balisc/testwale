import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const PHYSICS_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Units, Measurements & Dimensions | इकाइयाँ, माप और आयाम',
    note: 'Covers Physics-specific dimensional analysis, measurement accuracy and dimensional formulae. Basic SI units and measuring instruments are covered in General Science. | भौतिकी-विशिष्ट आयामी विश्लेषण, माप की सटीकता और आयामी सूत्रों को कवर करता है। मूल SI इकाइयाँ और माप उपकरण सामान्य विज्ञान में शामिल हैं।',
    subtopics: [
      'SI Units | SI इकाइयाँ',
      'Fundamental & Derived Units | मूल और व्युत्पन्न इकाइयाँ',
      'Dimensions & Dimensional Formula | आयाम और आयामी सूत्र',
      'Measurement Errors & Significant Figures | माप त्रुटियाँ और महत्वपूर्ण अंक',
    ],
  },
  {
    id: 2,
    title: 'Motion (Kinematics) | गति (गतिकी)',
    subtopics: [
      'Distance & Displacement | दूरी और विस्थापन',
      'Speed & Velocity | चाल और वेग',
      'Acceleration | त्वरण',
      'Equations & Graphs of Motion | गति के समीकरण और ग्राफ',
    ],
  },
  {
    id: 3,
    title: "Force & Laws of Motion | बल और गति के नियम",
    subtopics: [
      "Newton's Laws of Motion | न्यूटन के गति के नियम",
      'Inertia | जड़त्व',
      'Momentum & Impulse | संवेग और प्रेरण',
      'Friction | घर्षण',
    ],
  },
  {
    id: 4,
    title: 'Work, Energy & Power | कार्य, ऊर्जा और शक्ति',
    subtopics: [
      'Work | कार्य',
      'Kinetic & Potential Energy | गतिज और स्थितिज ऊर्जा',
      'Conservation of Energy | ऊर्जा संरक्षण',
      'Power & Efficiency | शक्ति और दक्षता',
    ],
  },
  {
    id: 5,
    title: 'Gravitation | गुरुत्वाकर्षण',
    note: 'Satellites are covered only from the Physics perspective (orbital motion, gravitational force and escape velocity). Satellite types, applications and ISRO missions belong to Space Science. | उपग्रह केवल भौतिकी के दृष्टिकोण से (कक्षीय गति, गुरुत्वाकर्षण बल और पलायन वेग) कवर किए गए हैं। उपग्रह प्रकार, अनुप्रयोग और ISRO मिशन अंतरिक्ष विज्ञान में आते हैं।',
    subtopics: [
      'Universal Law of Gravitation | गुरुत्वाकर्षण का सार्वभौमिक नियम',
      'Acceleration due to Gravity (g) | गुरुत्व के कारण त्वरण (g)',
      'Mass & Weight | द्रव्यमान और भार',
      'Escape Velocity & Artificial Satellites (Basics) | पलायन वेग और कृत्रिम उपग्रह (मूलभूत)',
    ],
  },
  {
    id: 6,
    title: 'Pressure & Fluid Mechanics | दाब और द्रव यांत्रिकी',
    subtopics: [
      'Pressure | दाब',
      'Buoyancy | उछाल बल',
      "Archimedes' Principle | आर्किमिडीज़ का सिद्धांत",
      "Pascal's Law | पास्कल का नियम",
    ],
  },
  {
    id: 7,
    title: 'Heat & Temperature | ऊष्मा और तापमान',
    subtopics: [
      'Heat vs Temperature | ऊष्मा बनाम तापमान',
      'Thermometry | तापमापन',
      'Specific Heat Capacity | विशिष्ट ऊष्मा धारिता',
      'Thermal Expansion | ऊष्मीय प्रसार',
    ],
  },
  {
    id: 8,
    title: 'Transfer of Heat | ऊष्मा का स्थानांतरण',
    subtopics: [
      'Conduction | चालन',
      'Convection | संवहन',
      'Radiation | विकिरण',
      'Everyday Applications | दैनिक जीवन के अनुप्रयोग',
    ],
  },
  {
    id: 9,
    title: 'Light & Optics | प्रकाश और प्रकाशिकी',
    subtopics: [
      'Reflection | परावर्तन',
      'Refraction | अपवर्तन',
      'Mirrors | दर्पण',
      'Lenses | लेंस',
    ],
  },
  {
    id: 10,
    title: 'Human Eye & Optical Instruments | मानव नेत्र और प्रकाशिक यंत्र',
    note: 'Covers the Human Eye only as an optical system. Detailed anatomy and physiology belong to Biology. | केवल मानव नेत्र को एक प्रकाशिक प्रणाली के रूप में कवर करता है। विस्तृत शारीरिक रचना और शरीर क्रिया विज्ञान में आती है।',
    subtopics: [
      'Human Eye as an Optical Instrument | प्रकाशिक यंत्र के रूप में मानव नेत्र',
      'Defects of Vision & Correction | दृष्टि दोष और सुधार',
      'Microscope | सूक्ष्मदर्शी',
      'Telescope | दूरदर्शी',
    ],
  },
  {
    id: 11,
    title: 'Sound | ध्वनि',
    subtopics: [
      'Nature of Sound | ध्वनि की प्रकृति',
      'Frequency, Time Period & Amplitude | आवृत्ति, आवर्तकाल और तरंग-आयाम',
      'Echo | प्रतिध्वनि',
      'Ultrasound & Applications | अल्ट्रासाउंड और अनुप्रयोग',
    ],
  },
  {
    id: 12,
    title: 'Electricity | विद्युत',
    subtopics: [
      'Electric Current | विद्युत धारा',
      'Potential Difference (Voltage) | विभवांतर (वोल्टेज)',
      'Resistance & Resistivity | प्रतिरोध और विशिष्ट प्रतिरोध',
      "Ohm's Law | ओम का नियम",
      'Electric Power & Electrical Energy | विद्युत शक्ति और विद्युत ऊर्जा',
    ],
  },
  {
    id: 13,
    title: 'Magnetism & Electromagnetism | चुंबकत्व और विद्युतचुंबकत्व',
    subtopics: [
      'Magnetic Field | चुंबकीय क्षेत्र',
      'Permanent Magnets | स्थायी चुंबक',
      'Electromagnetic Induction | विद्युतचुंबकीय प्रेरण',
      'Electric Motor & Generator | विद्युत मोटर और जनित्र',
    ],
  },
  {
    id: 14,
    title: 'Modern Physics | आधुनिक भौतिकी',
    subtopics: [
      'Atomic Structure (Basics) | परमाणु संरचना (मूलभूत)',
      'Radioactivity | रेडियोधर्मिता',
      'Nuclear Fission & Nuclear Fusion | नाभिकीय विखंडन और नाभिकीय संलयन',
      'X-rays | एक्स-किरणें',
      'Lasers | लेज़र',
    ],
  },
];

export const PHYSICS_PAGE_TITLE = {
  en: 'Physics',
  hi: 'भौतिकी',
};

export const PHYSICS_SECTION_LABEL = {
  en: 'Physics Topics',
  hi: 'भौतिकी के विषय',
};

export const PHYSICS_SCOPE = {
  en: 'Physical laws, matter, motion, energy, heat, light, sound, electricity, magnetism and introductory modern physics.',
  hi: 'भौतिक नियम, पदार्थ, गति, ऊर्जा, ऊष्मा, प्रकाश, ध्वनि, विद्युत, चुंबकत्व और प्रारंभिक आधुनिक भौतिकी।',
};
