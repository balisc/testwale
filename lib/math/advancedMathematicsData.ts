import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const ADVANCED_MATHEMATICS_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Set Theory | समुच्चय सिद्धांत',
    subtopics: [
      'Types of Sets | समुच्चयों के प्रकार',
      'Venn Diagrams | वेन आरेख',
      'Union and Intersection | संयोजन और प्रतिच्छेद',
      'Complement of Sets | समुच्चय का पूरक',
    ],
  },
  {
    id: 2,
    title: 'Relations | संबंध',
    subtopics: [
      'Types of Relations | संबंधों के प्रकार',
      'Ordered Pairs | क्रमित युग्म',
      'Reflexive, Symmetric and Transitive Relations | प्रतिबिंबित, सममित और सांपरक संबंध',
      'Equivalence Relation Basics | समसम्बन्ध की मूल बातें',
    ],
  },
  {
    id: 3,
    title: 'Functions | फलन',
    subtopics: [
      'Domain | परिभाषा-क्षेत्र',
      'Range | प्रतिमान',
      'Types of Functions | फलनों के प्रकार',
      'Composite Functions | संयुक्त फलन',
    ],
  },
  {
    id: 4,
    title: 'Matrices | आव्यूह',
    subtopics: [
      'Types of Matrices | आव्यूहों के प्रकार',
      'Matrix Addition | आव्यूह का योग',
      'Matrix Multiplication | आव्यूह का गुणन',
      'Matrix Operations | आव्यूह संक्रियाएँ',
    ],
  },
  {
    id: 5,
    title: 'Determinants | सारक',
    subtopics: [
      'Determinant of 2×2 Matrix | 2×2 आव्यूह का सारक',
      'Determinant of 3×3 Matrix | 3×3 आव्यूह का सारक',
      'Properties of Determinants | सारकों के गुण',
      'Application in Solving Equations | समीकरण हल करने में अनुप्रयोग',
    ],
  },
  {
    id: 6,
    title: 'Coordinate Geometry (Advanced) | निर्देशांक ज्यामिति (उन्नत)',
    subtopics: [
      'Note: Covers advanced line geometry only (slope and equation of line). Point-based concepts such as Distance Formula, Midpoint, Section Formula and Area of Triangle are covered in Topic 4 (Geometry & Mensuration) | नोट: केवल उन्नत रेखा ज्यामिति (ढाल और रेखा का समीकरण)। बिंदु-आधारित अवधारणाएँ विषय 4 (ज्यामिति और क्षेत्रमिति) में',
      'Slope | ढाल',
      'Equation of Straight Line | सरल रेखा का समीकरण',
      'Parallel and Perpendicular Lines | समांतर और लंबवत रेखाएँ',
      'Angle between Two Lines | दो रेखाओं के बीच का कोण',
    ],
  },
  {
    id: 7,
    title: 'Conic Sections (Basics) | शंकु परिच्छेद (मूल)',
    subtopics: [
      'Note: Keep this only for advanced exams (CDS, NDA, CAT, etc.) | नोट: केवल उन्नत परीक्षाओं के लिए (CDS, NDA, CAT आदि)',
      'Circle | वृत्त',
      'Parabola | परवलय',
      'Ellipse | दीर्घवृत्त',
      'Hyperbola | अतिपरवलय',
    ],
  },
  {
    id: 8,
    title: 'Vectors | सदिश',
    subtopics: [
      'Scalar and Vector | अदिश और सदिश',
      'Vector Addition | सदिश योग',
      'Dot Product | अदिश गुणनफल',
      'Cross Product (Basics) | क्रॉस गुणनफल (मूल)',
    ],
  },
  {
    id: 9,
    title: 'Calculus (Basics) | कैलकुलस (मूल)',
    subtopics: [
      'Limits | सीमा',
      'Continuity | सांतत्य',
      'Differentiation Basics | अवकलन की मूल बातें',
      'Application of Derivatives | अवकलज के अनुप्रयोग',
    ],
  },
  {
    id: 10,
    title: 'Integration (Basics) | समाकलन (मूल)',
    subtopics: [
      'Basic Integration Formulas | मूलभूत समाकलन सूत्र',
      'Indefinite Integral | अनिश्चित समाकल',
      'Definite Integral | निश्चित समाकल',
      'Area under Curve (Basics) | वक्र के नीचे क्षेत्रफल (मूल)',
    ],
  },
  {
    id: 11,
    title: 'Complex Numbers | समिश्र संख्याएँ',
    subtopics: [
      'Real and Imaginary Parts | वास्तविक और काल्पनिक भाग',
      'Modulus | परिमाण',
      'Argument (Basics) | तर्क (मूल)',
      'Basic Operations | मूलभूत संक्रियाएँ',
    ],
  },
  {
    id: 12,
    title: 'Mathematical Reasoning | गणितीय तर्क',
    subtopics: [
      'Note: Covers formal mathematical logic (NCERT-style). Logical puzzles, coding-decoding and aptitude reasoning are covered separately in the Reasoning subject | नोट: औपचारिक गणितीय तर्क (NCERT-शैली)। तार्किक पहेलियाँ, कोडिंग-डिकोडिंग और योग्यता तर्क Reasoning विषय में',
      'Statements | कथन',
      'Logical Connectives | तार्किक संयोजक',
      'Implication | निहितार्थ',
      'Converse and Contrapositive | विपरीत और प्रतिलोम',
    ],
  },
];

export const ADVANCED_MATHEMATICS_PAGE_TITLE = {
  en: 'Advanced Mathematics',
  hi: 'उन्नत गणित',
};

export const ADVANCED_MATHEMATICS_SECTION_LABEL = {
  en: 'Advanced Mathematics Topics',
  hi: 'उन्नत गणित के विषय',
};

export const ADVANCED_MATHEMATICS_SCOPE = {
  en: 'Higher-level mathematics for advanced government exams and strong aptitude sections.',
  hi: 'उन्नत सरकारी परीक्षाओं और मजबूत योग्यता खंडों के लिए उच्च स्तर का गणित।',
};
