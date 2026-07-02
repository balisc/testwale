import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const DATA_INTERPRETATION_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Table-Based Data Interpretation | सारणी-आधारित आंकड़ा व्याख्या',
    subtopics: [
      'Single Table | एकल सारणी',
      'Multiple Tables | बहु सारणियाँ',
      'Percentage-Based Questions | प्रतिशत-आधारित प्रश्न',
      'Ratio & Proportion Questions | अनुपात और समानुपात प्रश्न',
      'Average-Based Questions | औसत-आधारित प्रश्न',
      'Comparison & Ranking | तुलना और क्रम',
      'Missing Value Questions | लुप्त मान प्रश्न',
    ],
  },
  {
    id: 2,
    title: 'Bar Graph Data Interpretation | स्तंभ ग्राफ आंकड़ा व्याख्या',
    subtopics: [
      'Simple Bar Graph | सरल स्तंभ ग्राफ',
      'Double Bar Graph | दोहरा स्तंभ ग्राफ',
      'Percentage & Ratio Questions | प्रतिशत और अनुपात प्रश्न',
      'Growth & Trend Analysis | वृद्धि और प्रवृत्ति विश्लेषण',
      'Comparison-Based Questions | तुलना-आधारित प्रश्न',
      'Mixed Calculation Questions | मिश्रित गणना प्रश्न',
    ],
  },
  {
    id: 3,
    title: 'Line Graph Data Interpretation | रेखा ग्राफ आंकड़ा व्याख्या',
    subtopics: [
      'Trend Analysis | प्रवृत्ति विश्लेषण',
      'Increase & Decrease | वृद्धि और कमी',
      'Average from Line Graph | रेखा ग्राफ से औसत',
      'Multi-Line Graph | बहु-रेखा ग्राफ',
      'Growth Rate Questions | वृद्धि दर प्रश्न',
      'Comparative Analysis | तुलनात्मक विश्लेषण',
    ],
  },
  {
    id: 4,
    title: 'Pie Chart Data Interpretation | वृत्त चित्र आंकड़ा व्याख्या',
    subtopics: [
      'Central Angle | केंद्रीय कोण',
      'Percentage Share | प्रतिशत हिस्सा',
      'Value Calculation | मान की गणना',
      'Sector Comparison | खंड तुलना',
      'Ratio-Based Questions | अनुपात-आधारित प्रश्न',
      'Mixed Calculation Questions | मिश्रित गणना प्रश्न',
    ],
  },
  {
    id: 5,
    title: 'Mixed Graph Data Interpretation | मिश्रित ग्राफ आंकड़ा व्याख्या',
    subtopics: [
      'Table + Bar Graph | सारणी + स्तंभ ग्राफ',
      'Pie Chart + Table | वृत्त चित्र + सारणी',
      'Line Graph + Table | रेखा ग्राफ + सारणी',
      'Multiple Graph Combination | बहु-ग्राफ संयोजन',
      'Multi-Source Data Interpretation | बहु-स्रोत आंकड़ा व्याख्या',
    ],
  },
  {
    id: 6,
    title: 'Caselet Data Interpretation | केसलेट आंकड़ा व्याख्या',
    subtopics: [
      'Paragraph-Based Data | अनुच्छेद-आधारित आंकड़े',
      'Arrangement-Based Data | व्यवस्था-आधारित आंकड़े',
      'Hidden Data Extraction | छिपे आंकड़ों का निष्कर्षण',
      'Logical Data Interpretation | तार्किक आंकड़ा व्याख्या',
      'Multi-Step Calculation | बहु-चरण गणना',
    ],
  },
  {
    id: 7,
    title: 'Approximation & Quick Calculation in DI | DI में सन्निकटन और त्वरित गणना',
    subtopics: [
      'Note: Applicable across all DI formats (Table, Bar, Line, Pie and Mixed DI) | नोट: सभी DI प्रारूपों पर लागू (सारणी, स्तंभ, रेखा, वृत्त चित्र और मिश्रित DI)',
      'Fast Calculation Techniques | त्वरित गणना तकनीकें',
      'Approximation | सन्निकटन',
      'Rounding Off | पूर्णांकन',
      'Estimation | अनुमान',
      'Closest Option Selection | निकटतम विकल्प चयन',
    ],
  },
  {
    id: 8,
    title: 'Data Sufficiency | आंकड़ा पर्याप्तता',
    subtopics: [
      'Note: Covers only quantitative/numerical data sufficiency. Logical Data Sufficiency and Decision Making belong to the Reasoning subject | नोट: केवल मात्रात्मक/संख्यात्मक आंकड़ा पर्याप्तता। तार्किक आंकड़ा पर्याप्तता और निर्णय लेना Reasoning विषय में',
      'Statement-Based Sufficiency | कथन-आधारित पर्याप्तता',
      'Quantitative Sufficiency | मात्रात्मक पर्याप्तता',
      'Comparison Sufficiency | तुलना पर्याप्तता',
      'Missing Data Judgement | लुप्त आंकड़ा निर्णय',
      'Multi-Statement Sufficiency | बहु-कथन पर्याप्तता',
    ],
  },
];

export const DATA_INTERPRETATION_PAGE_TITLE = {
  en: 'Data Interpretation',
  hi: 'आंकड़ा व्याख्या',
};

export const DATA_INTERPRETATION_SECTION_LABEL = {
  en: 'Data Interpretation Topics',
  hi: 'आंकड़ा व्याख्या के विषय',
};

export const DATA_INTERPRETATION_SCOPE = {
  en: 'Tables, charts, graphs and data-based quantitative analysis.',
  hi: 'सारणियाँ, चार्ट, ग्राफ और आंकड़ों पर आधारित मात्रात्मक विश्लेषण।',
};
