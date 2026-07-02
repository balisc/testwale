import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const GEOMETRY_MENSURATION_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Lines & Angles | रेखाएँ और कोण',
    subtopics: [
      'Types of Angles | कोण के प्रकार',
      'Parallel Lines & Transversal | समांतर रेखाएँ और तिर्यक',
      'Angle Properties | कोण के गुण',
      'Complementary & Supplementary Angles | पूरक और संपूरक कोण',
      'Angle-Based Problems | कोण-आधारित प्रश्न',
    ],
  },
  {
    id: 2,
    title: 'Triangles | त्रिभुज',
    subtopics: [
      'Types of Triangles | त्रिभुज के प्रकार',
      'Angle Sum Property | कोणों का योग गुण',
      'Congruence | सर्वांगसमता',
      'Similarity | समानता',
      'Triangle-Based Problems | त्रिभुज-आधारित प्रश्न',
    ],
  },
  {
    id: 3,
    title: 'Properties of Triangles | त्रिभुज के गुण',
    subtopics: [
      'Median | माध्यिका',
      'Altitude | शीर्षलंब',
      'Angle Bisector | कोण द्विभाजक',
      'Centroid, Incentre, Circumcentre & Orthocentre | केंद्रक, अंत:केंद्र, परिकेंद्र और लंबकेंद्र',
      'Triangle Property Applications | त्रिभुज गुण अनुप्रयोग',
    ],
  },
  {
    id: 4,
    title: 'Quadrilaterals | चतुर्भुज',
    subtopics: [
      'Square | वर्ग',
      'Rectangle | आयत',
      'Parallelogram | समांतर चतुर्भुज',
      'Rhombus | समचतुर्भुज',
      'Trapezium | समलंब',
      'Property-Based Questions | गुण-आधारित प्रश्न',
    ],
  },
  {
    id: 5,
    title: 'Polygons | बहुभुज',
    subtopics: [
      'Interior Angles | अंत:कोण',
      'Exterior Angles | बाह्यकोण',
      'Regular Polygons | सम बहुभुज',
      'Diagonals | विकर्ण',
      'Polygon Applications | बहुभुज अनुप्रयोग',
    ],
  },
  {
    id: 6,
    title: 'Circle | वृत्त',
    subtopics: [
      'Radius & Diameter | त्रिज्या और व्यास',
      'Chord | ज्या',
      'Tangent & Secant | स्पर्शरेखा और छेदक',
      'Arc & Sector | चाप और सेक्टर',
      'Circle Basics | वृत्त की मूल बातें',
    ],
  },
  {
    id: 7,
    title: 'Circle Theorems | वृत्त प्रमेय',
    subtopics: [
      'Angle in a Semicircle | अर्धवृत्त में कोण',
      'Equal Chords & Equal Angles | समान ज्या और समान कोण',
      'Tangent–Radius Relation | स्पर्शरेखा–त्रिज्या संबंध',
      'Cyclic Quadrilateral | चक्रीय चतुर्भुज',
      'Theorem-Based Questions | प्रमेय-आधारित प्रश्न',
    ],
  },
  {
    id: 8,
    title: 'Perimeter, Area & 2D Mensuration | परिमाप, क्षेत्रफल और 2D क्षेत्रमिति',
    subtopics: [
      'Perimeter of Plane Figures | समतल आकृतियों का परिमाप',
      'Area of Triangle (including Heron\'s Formula) | त्रिभुज का क्षेत्रफल (हेरॉन सूत्र सहित)',
      'Area of Quadrilaterals | चतुर्भुज का क्षेत्रफल',
      'Circle (Area & Circumference) | वृत्त (क्षेत्रफल और परिधि)',
      'Sector & Segment | सेक्टर और खंड',
      'Composite/Combined 2D Figures | संयुक्त/मिश्र 2D आकृतियाँ',
    ],
  },
  {
    id: 9,
    title: 'Surface Area & Volume of Solids | ठोसों का पृष्ठीय क्षेत्रफल और आयतन',
    subtopics: [
      'Cube & Cuboid (CSA, TSA & Volume) | घन और घनाभ (CSA, TSA और आयतन)',
      'Cylinder (CSA, TSA & Volume) | बेलन (CSA, TSA और आयतन)',
      'Cone (CSA, TSA & Volume) | शंकु (CSA, TSA और आयतन)',
      'Sphere & Hemisphere (CSA, TSA & Volume) | गोला और अर्धगोला (CSA, TSA और आयतन)',
      'Frustum & Composite Solids | छिन्नक और संयुक्त ठोस',
      'Mensuration-Based Applications | क्षेत्रमिति-आधारित अनुप्रयोग',
    ],
  },
  {
    id: 10,
    title: 'Coordinate Geometry Basics | निर्देशांक ज्यामिति की मूल बातें',
    subtopics: [
      'Cartesian Coordinate System | कार्तीय निर्देशांक तंत्र',
      'Distance Formula | दूरी सूत्र',
      'Midpoint Formula | मध्यबिंदु सूत्र',
      'Section Formula | विभाजन सूत्र',
      'Area of Triangle | त्रिभुज का क्षेत्रफल',
    ],
  },
  {
    id: 11,
    title: 'Practical Geometry Applications | व्यावहारिक ज्यामिति अनुप्रयोग',
    subtopics: [
      'Note: Covers only real-world application questions. Core concepts and formulas belong to Topics 4.8 and 4.9 | नोट: केवल वास्तविक अनुप्रयोग प्रश्न। मूल अवधारणाएँ और सूत्र विषय 4.8 और 4.9 में',
      'Field Measurement | क्षेत्र माप',
      'Pathway & Border Problems | मार्ग और किनारा प्रश्न',
      'Tank & Container Problems | टैंक और पात्र प्रश्न',
      'Painted Surface Problems | रंगी हुई सतह प्रश्न',
      'Mixed Geometry Applications | मिश्रित ज्यामिति अनुप्रयोग',
    ],
  },
];

export const GEOMETRY_MENSURATION_PAGE_TITLE = {
  en: 'Geometry & Mensuration',
  hi: 'ज्यामिति और क्षेत्रमिति',
};

export const GEOMETRY_MENSURATION_SECTION_LABEL = {
  en: 'Geometry & Mensuration Topics',
  hi: 'ज्यामिति और क्षेत्रमिति के विषय',
};

export const GEOMETRY_MENSURATION_SCOPE = {
  en: 'Plane geometry, coordinate geometry, mensuration and practical applications.',
  hi: 'समतल ज्यामिति, निर्देशांक ज्यामिति, क्षेत्रमिति और व्यावहारिक अनुप्रयोग।',
};
