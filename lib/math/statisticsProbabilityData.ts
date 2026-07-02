import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const STATISTICS_PROBABILITY_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Data Collection & Classification | आंकड़ा संग्रह और वर्गीकरण',
    subtopics: [
      'Raw Data | कच्चा आंकड़ा',
      'Grouped Data | समूहीकृत आंकड़ा',
      'Ungrouped Data | असमूहीकृत आंकड़ा',
      'Data Classification | आंकड़ा वर्गीकरण',
    ],
  },
  {
    id: 2,
    title: 'Frequency Distribution | आवृत्ति वितरण',
    subtopics: [
      'Class Interval | वर्ग अंतराल',
      'Class Mark | वर्ग चिह्न',
      'Frequency Table | आवृत्ति सारणी',
      'Cumulative Frequency | संचयी आवृत्ति',
      'Frequency Distribution Applications | आवृत्ति वितरण अनुप्रयोग',
    ],
  },
  {
    id: 3,
    title: 'Mean | माध्य',
    subtopics: [
      'Arithmetic Mean | समांतर माध्य',
      'Mean of Grouped Data | समूहीकृत आंकड़ों का माध्य',
      'Weighted Mean | भारित माध्य',
      'Combined Mean | संयुक्त माध्य',
      'Mean-Based Applications | माध्य-आधारित अनुप्रयोग',
    ],
  },
  {
    id: 4,
    title: 'Median | माध्यिका',
    subtopics: [
      'Median of Ungrouped Data | असमूहीकृत आंकड़ों की माध्यिका',
      'Median of Grouped Data | समूहीकृत आंकड़ों की माध्यिका',
      'Position-Based Median | स्थिति-आधारित माध्यिका',
      'Median Formula | माध्यिका सूत्र',
      'Median Interpretation | माध्यिका व्याख्या',
    ],
  },
  {
    id: 5,
    title: 'Mode | बहुलक',
    subtopics: [
      'Mode of Ungrouped Data | असमूहीकृत आंकड़ों का बहुलक',
      'Mode of Grouped Data | समूहीकृत आंकड़ों का बहुलक',
      'Modal Class | बहुलक वर्ग',
      'Empirical Relation (Mean–Median–Mode) | अनुभवजन्य संबंध (माध्य–माध्यिका–बहुलक)',
      'Mode Interpretation | बहुलक व्याख्या',
    ],
  },
  {
    id: 6,
    title: 'Range & Dispersion | परास और प्रकीर्णन',
    subtopics: [
      'Range | परास',
      'Mean Deviation (Basics) | माध्य विचलन (मूल)',
      'Variance (Basics) | प्रसरण (मूल)',
      'Standard Deviation (Basics) | मानक विचलन (मूल)',
      'Dispersion-Based Questions | प्रकीर्णन-आधारित प्रश्न',
    ],
  },
  {
    id: 7,
    title: 'Graphical Representation | आलेखीय निरूपण',
    subtopics: [
      'Note: Covers statistical graphs used for frequency distribution. Comparative Bar Graphs used in Data Interpretation are covered in Topic 6 | नोट: आवृत्ति वितरण के सांख्यिकीय ग्राफ। तुलनात्मक स्तंभ ग्राफ आंकड़ा व्याख्या (विषय 6) में',
      'Histogram | स्तंभलेख',
      'Frequency Polygon | आवृत्ति बहुभुज',
      'Ogive (Less Than & More Than) | संचयी वक्र (कम से और अधिक से)',
      'Bar Diagram (Statistical Context) | स्तंभ चित्र (सांख्यिकीय संदर्भ)',
      'Graph Interpretation | ग्राफ व्याख्या',
    ],
  },
  {
    id: 8,
    title: 'Probability Basics | प्रायिकता की मूल बातें',
    subtopics: [
      'Random Experiment | यादृच्छिक प्रयोग',
      'Sample Space | नमूना स्थान',
      'Event | घटना',
      'Favourable Outcomes | अनुकूल परिणाम',
      'Basic Probability Concepts | मूलभूत प्रायिकता अवधारणाएँ',
    ],
  },
  {
    id: 9,
    title: 'Simple Probability | सरल प्रायिकता',
    subtopics: [
      'Coin Problems | सिक्का प्रश्न',
      'Dice Problems | पासा प्रश्न',
      'Card Problems | ताश प्रश्न',
      'Balls & Bags | गेंद और थैले',
      'Basic Probability Applications | मूलभूत प्रायिकता अनुप्रयोग',
    ],
  },
  {
    id: 10,
    title: 'Compound Probability | संयुक्त प्रायिकता',
    subtopics: [
      'Independent Events | स्वतंत्र घटनाएँ',
      'Dependent Events | आश्रित घटनाएँ',
      'Mutually Exclusive Events | परस्पर अपवर्जी घटनाएँ',
      'Addition Rule | जोड़ नियम',
      'Multiplication Rule | गुणन नियम',
      'Conditional Probability (Basic) | सशर्त प्रायिकता (मूल)',
    ],
  },
  {
    id: 11,
    title: 'Permutation | क्रमचय',
    subtopics: [
      'Factorial | क्रमगुणित',
      'Linear Arrangement | रैखिक व्यवस्था',
      'Circular Arrangement (Basic) | वृत्ताकार व्यवस्था (मूल)',
      'Repetition Cases | पुनरावृत्ति के मामले',
      'Arrangement-Based Questions | व्यवस्था-आधारित प्रश्न',
    ],
  },
  {
    id: 12,
    title: 'Combination | संचय',
    subtopics: [
      'Basic Selection | मूलभूत चयन',
      'nCr Formula | nCr सूत्र',
      'Selection with Conditions | शर्तों सहित चयन',
      'Permutation vs Combination | क्रमचय बनाम संचय',
      'Combination-Based Applications | संचय-आधारित अनुप्रयोग',
    ],
  },
];

export const STATISTICS_PROBABILITY_PAGE_TITLE = {
  en: 'Statistics & Probability',
  hi: 'सांख्यिकी और प्रायिकता',
};

export const STATISTICS_PROBABILITY_SECTION_LABEL = {
  en: 'Statistics & Probability Topics',
  hi: 'सांख्यिकी और प्रायिकता के विषय',
};

export const STATISTICS_PROBABILITY_SCOPE = {
  en: 'Data handling, central tendency, dispersion and probability.',
  hi: 'आंकड़ा प्रबंधन, केंद्रीय प्रवृत्ति, प्रकीर्णन और प्रायिकता।',
};
