import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const NUMBER_SYSTEM_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Types of Numbers | संख्याओं के प्रकार',
    subtopics: [
      'Natural Numbers | प्राकृतिक संख्याएँ',
      'Whole Numbers | पूर्ण संख्याएँ',
      'Integers | पूर्णांक',
      'Rational & Irrational Numbers | परिमेय और अपरिमेय संख्याएँ',
      'Real Numbers | वास्तविक संख्याएँ',
    ],
  },
  {
    id: 2,
    title: 'Place Value & Face Value | स्थान मान और अंक मान',
    subtopics: [
      'Place Value | स्थान मान',
      'Face Value | अंक मान',
      'Expanded Form | विस्तृत रूप',
      'Number Comparison | संख्या तुलना',
    ],
  },
  {
    id: 3,
    title: 'Divisibility Rules | विभाज्यता नियम',
    subtopics: [
      'Divisibility by 2, 3, 4, 5 & 6 | 2, 3, 4, 5 और 6 से विभाज्यता',
      'Divisibility by 7, 8, 9, 10 & 11 | 7, 8, 9, 10 और 11 से विभाज्यता',
      'Combined Divisibility | संयुक्त विभाज्यता',
      'Digit-based Questions | अंक-आधारित प्रश्न',
    ],
  },
  {
    id: 4,
    title: 'Factors & Multiples | गुणनखंड और गुणज',
    subtopics: [
      'Factors | गुणनखंड',
      'Multiples | गुणज',
      'Prime Factors | अभाज्य गुणनखंड',
      'Common Factors & Common Multiples | सामान्य गुणनखंड और सामान्य गुणज',
    ],
  },
  {
    id: 5,
    title: 'Prime & Composite Numbers | अभाज्य और भाज्य संख्याएँ',
    subtopics: [
      'Prime Numbers | अभाज्य संख्याएँ',
      'Composite Numbers | भाज्य संख्याएँ',
      'Co-prime Numbers | सह-अभाज्य संख्याएँ',
      'Twin Primes | जुड़वाँ अभाज्य',
    ],
  },
  {
    id: 6,
    title: 'HCF & LCM | महत्तम समापवर्तक और लघुत्तम समापवर्त्य',
    subtopics: [
      'HCF | महत्तम समापवर्तक (HCF)',
      'LCM | लघुत्तम समापवर्त्य (LCM)',
      'Product Relation of Two Numbers | दो संख्याओं का गुणनफल संबंध',
      'Application-based HCF & LCM Questions | अनुप्रयोग-आधारित HCF और LCM प्रश्न',
    ],
  },
  {
    id: 7,
    title: 'Remainder Concepts | शेषफल अवधारणाएँ',
    subtopics: [
      'Basic Remainder Questions | मूलभूत शेषफल प्रश्न',
      'Successive Division | क्रमिक विभाजन',
      'Negative Remainders | ऋणात्मक शेषफल',
      'Pattern-based Remainders | पैटर्न-आधारित शेषफल',
    ],
  },
  {
    id: 8,
    title: 'Unit Digit & Last Digit | इकाई अंक और अंतिम अंक',
    subtopics: [
      'Unit Digit Cycles | इकाई अंक चक्र',
      'Last Two Digits | अंतिम दो अंक',
      'Powers & Cyclicity | घात और चक्रता',
      'Multiplication & Exponent Patterns | गुणन और घातांक पैटर्न',
    ],
  },
  {
    id: 9,
    title: 'Number Series | संख्या श्रृंखला',
    subtopics: [
      'Arithmetic Pattern | अंकगणितीय पैटर्न',
      'Geometric Pattern | गुणोत्तर पैटर्न',
      'Mixed Pattern | मिश्रित पैटर्न',
      'Missing Number | लुप्त संख्या',
      'Note: Logical pattern series covered in Reasoning subject | नोट: तार्किक पैटर्न श्रृंखला "तर्क" विषय में',
    ],
  },
  {
    id: 10,
    title: 'Simplification & Approximation | सरलीकरण और सन्निकटन',
    subtopics: [
      'BODMAS | BODMAS',
      'Fractions | भिन्न',
      'Decimals | दशमलव',
      'Surds (Basics) | करणी (मूलभूत)',
      'Approximation Techniques | सन्निकटन तकनीक',
    ],
  },
  {
    id: 11,
    title: 'Squares, Cubes & Roots | वर्ग, घन और मूल',
    subtopics: [
      'Square & Square Root | वर्ग और वर्गमूल',
      'Cube & Cube Root | घन और घनमूल',
      'Perfect Squares | पूर्ण वर्ग',
      'Perfect Cubes | पूर्ण घन',
    ],
  },
  {
    id: 12,
    title: 'Decimal & Fraction Conversion | दशमलव और भिन्न रूपांतरण',
    subtopics: [
      'Fractions to Decimals | भिन्न से दशमलव',
      'Decimals to Fractions | दशमलव से भिन्न',
      'Recurring Decimals | आवर्ती दशमलव',
      'Fraction–Decimal–Percentage Relationship | भिन्न–दशमलव–प्रतिशत संबंध',
    ],
  },
];

export const NUMBER_SYSTEM_PAGE_TITLE = {
  en: 'Number System',
  hi: 'संख्या पद्धति',
};

export const NUMBER_SYSTEM_SECTION_LABEL = {
  en: 'Number System Topics',
  hi: 'संख्या पद्धति के विषय',
};

export const NUMBER_SYSTEM_SCOPE = {
  en: 'Numbers, divisibility, factors, remainders and basic numerical properties.',
  hi: 'संख्याएँ, विभाज्यता, गुणनखंड, शेषफल और मूलभूत संख्यात्मक गुण।',
};
