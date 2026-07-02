import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const TRIGONOMETRY_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Trigonometric Ratios (Right Triangle Basis) | त्रिकोणमितीय अनुपात (समकोण त्रिभुज आधार)',
    subtopics: [
      'Sine (sin θ) | ज्या (sin θ)',
      'Cosine (cos θ) | कोज्या (cos θ)',
      'Tangent (tan θ) | स्पर्शज्या (tan θ)',
      'Cosecant (cosec θ) | कोटिज्या (cosec θ)',
      'Secant (sec θ) | कोटिस्पर्शज्या (sec θ)',
      'Cotangent (cot θ) | कोटिस्पर्श (cot θ)',
      'Base, Perpendicular & Hypotenuse | आधार, लंब और कर्ण',
      'Unknown Side Calculation | अज्ञात भुजा की गणना',
    ],
  },
  {
    id: 2,
    title: 'Standard Angles | मानक कोण',
    subtopics: [
      '0° | 0°',
      '30° | 30°',
      '45° | 45°',
      '60° | 60°',
      '90° | 90°',
      'Standard Trigonometric Ratio Table | मानक त्रिकोणमितीय अनुपात सारणी',
    ],
  },
  {
    id: 3,
    title: 'Trigonometric Identities & Simplification | त्रिकोणमितीय सर्वसमिकाएँ और सरलीकरण',
    subtopics: [
      'sin²θ + cos²θ = 1 | sin²θ + cos²θ = 1',
      '1 + tan²θ = sec²θ | 1 + tan²θ = sec²θ',
      '1 + cot²θ = cosec²θ | 1 + cot²θ = cosec²θ',
      'Ratio Conversion | अनुपात रूपांतरण',
      'Identity-Based Simplification | सर्वसमिका-आधारित सरलीकरण',
      'Multi-Step Simplification | बहु-चरण सरलीकरण',
      'Value-Based Questions | मान-आधारित प्रश्न',
    ],
  },
  {
    id: 4,
    title: 'Complementary Angles | पूरक कोण',
    subtopics: [
      'sin(90° − θ) | sin(90° − θ)',
      'cos(90° − θ) | cos(90° − θ)',
      'tan(90° − θ) | tan(90° − θ)',
      'Complementary Transformations | पूरक रूपांतरण',
      'Transformation-Based Questions | रूपांतरण-आधारित प्रश्न',
    ],
  },
  {
    id: 5,
    title: 'Heights & Distances | ऊँचाई और दूरी',
    subtopics: [
      'Angle of Elevation | उन्नयन कोण',
      'Angle of Depression | अवनमन कोण',
      'Tower-Based Problems | मीनार-आधारित प्रश्न',
      'Shadow-Based Problems | छाया-आधारित प्रश्न',
      'Application-Based Questions | अनुप्रयोग-आधारित प्रश्न',
    ],
  },
  {
    id: 6,
    title: 'Trigonometric Equations | त्रिकोणमितीय समीकरण',
    subtopics: [
      'Basic Trigonometric Equations | मूलभूत त्रिकोणमितीय समीकरण',
      'Standard Values | मानक मान',
      'Principal Solutions | मुख्य हल',
      'Range-Based Questions | परास-आधारित प्रश्न',
      'Equation-Based Applications | समीकरण-आधारित अनुप्रयोग',
    ],
  },
  {
    id: 7,
    title: 'Inverse Trigonometry (Advanced) | प्रतिलोम त्रिकोणमिति (उन्नत)',
    subtopics: [
      'Note: Recommended only for UPSC CDS, NDA, CAT, GATE and other advanced exams. Can be skipped for SSC, Railway and most State PCS exams | नोट: केवल UPSC CDS, NDA, CAT, GATE आदि उन्नत परीक्षाओं के लिए। SSC, Railway और अधिकांश State PCS में छोड़ा जा सकता है',
      'sin⁻¹x | sin⁻¹x',
      'cos⁻¹x | cos⁻¹x',
      'tan⁻¹x | tan⁻¹x',
      'Principal Value | मुख्य मान',
      'Basic Inverse Trigonometric Questions | मूलभूत प्रतिलोम त्रिकोणमितीय प्रश्न',
    ],
  },
];

export const TRIGONOMETRY_PAGE_TITLE = {
  en: 'Trigonometry',
  hi: 'त्रिकोणमिति',
};

export const TRIGONOMETRY_SECTION_LABEL = {
  en: 'Trigonometry Topics',
  hi: 'त्रिकोणमिति के विषय',
};

export const TRIGONOMETRY_SCOPE = {
  en: 'Trigonometric ratios, identities, equations and heights & distances.',
  hi: 'त्रिकोणमितीय अनुपात, सर्वसमिकाएँ, समीकरण और ऊँचाई तथा दूरी।',
};
