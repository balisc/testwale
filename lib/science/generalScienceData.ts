import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const GENERAL_SCIENCE_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Scientific Method | वैज्ञानिक पद्धति',
    subtopics: [
      'Observation | अवलोकन',
      'Hypothesis | परिकल्पना',
      'Experiment | प्रयोग',
      'Scientific Theory | वैज्ञानिक सिद्धांत',
      'Scientific Law | वैज्ञानिक नियम',
      'Scientific Reasoning | वैज्ञानिक तर्क',
    ],
  },
  {
    id: 2,
    title: 'SI Units, Measurements and Scientific Instruments | SI इकाइयाँ, माप और वैज्ञानिक उपकरण',
    note: 'Optical/thermal instruments (Microscope, Telescope, Thermometer) belong to Physics. | प्रकाशिक/ऊष्मीय उपकरण (सूक्ष्मदर्शी, दूरदर्शी, थर्मामीटर) भौतिकी में आते हैं।',
    subtopics: [
      'SI Units (Fundamental and Derived Units) | SI इकाइयाँ (मूल और व्युत्पन्न इकाइयाँ)',
      'pH Scale | pH स्केल',
      'Richter Scale | रिक्टर स्केल',
      'Beaufort Scale | ब्यूफोर्ट स्केल',
      'Decibel Scale | डेसिबल स्केल',
      'Celsius, Fahrenheit and Kelvin | सेल्सियस, Fahrenheit और Kelvin',
      'Barometer | बैरोमीटर',
      'Hygrometer | हाइग्रोमीटर',
      'Anemometer | एनीमोमीटर',
      'Seismograph | सिस्मोग्राफ',
      'Sphygmomanometer | स्फिग्मोमैनोमीटर',
      'Stethoscope | स्टेथोस्कोप',
      'Lactometer | लैक्टोमीटर',
      'Hydrometer | हाइड्रोमीटर',
      'Instrument-Based Applications | उपकरण-आधारित अनुप्रयोग',
    ],
  },
  {
    id: 3,
    title: 'Inventions, Discoveries and Scientists | आविष्कार, खोजें और वैज्ञानिक',
    note: "Subject-specific laws/discoveries (Newton's Laws, Periodic Table, DNA Structure) belong to respective subjects (Physics/Chemistry/Biology). | विषय-विशिष्ट नियम/खोजें (न्यूटन के नियम, आवर्त सारणी, DNA संरचना) संबंधित विषयों (भौतिकी/रसायन/जीव विज्ञान) में आती हैं।",
    subtopics: [
      'Major Scientific Inventions | प्रमुख वैज्ञानिक आविष्कार',
      'Important Scientific Discoveries | महत्वपूर्ण वैज्ञानिक खोजें',
      'Important Scientific Milestones | महत्वपूर्ण वैज्ञानिक मील के पत्थर',
      'Indian Scientists and Their Contributions | भारतीय वैज्ञानिक और उनका योगदान',
      'International Scientists and Their Contributions | अंतर्राष्ट्रीय वैज्ञानिक और उनका योगदान',
    ],
  },
  {
    id: 4,
    title: 'Science in Daily Life | दैनिक जीवन में विज्ञान',
    subtopics: [
      'Cooking Science | खाना पकाने में विज्ञान',
      'Refrigeration | प्रशीतन',
      'Pressure Cooker | प्रेशर कुकर',
      'Thermos Flask | थर्मस फ्लास्क',
      'Mirrors and Lenses in Daily Life | दैनिक जीवन में दर्पण और लेंस',
      'Washing and Cleaning Agents | धुलाई और सफाई अभिकर्मक',
    ],
  },
  {
    id: 5,
    title: 'Health, Hygiene and First Aid | स्वास्थ्य, स्वच्छता और प्राथमिक चिकित्सा',
    note: 'Vaccination, immunity and human diseases belong to Biology. | टीकाकरण, प्रतिरक्षा और मानव रोग जीव विज्ञान में आते हैं।',
    subtopics: [
      'Balanced Diet (Basic Awareness) | संतुलित आहार (मूलभूत जागरूकता)',
      'Personal Hygiene | व्यक्तिगत स्वच्छता',
      'Public Health Awareness | सार्वजनिक स्वास्थ्य जागरूकता',
      'Sanitation | स्वच्छता',
      'Safe Drinking Water | सुरक्षित पेयजल',
      'First Aid Basics | प्राथमिक चिकित्सा के मूलभूत सिद्धांत',
    ],
  },
  {
    id: 6,
    title: 'Basic Nutrition Facts (GK Level) | मूलभूत पोषण तथ्य (GK स्तर)',
    note: 'Detailed nutrients, vitamins, minerals and digestion belong to Biology. | विस्तृत पोषक तत्व, vitamins, खनिज और पाचन जीव विज्ञान में आते हैं।',
    subtopics: [
      'Food Adulteration | खाद्य मिलावट',
      'Food Preservation | खाद्य संरक्षण',
      'Common Deficiency Diseases | सामान्य अपर्याप्तता रोग',
      'Balanced Diet (General Awareness) | संतुलित आहार (सामान्य जागरूकता)',
    ],
  },
  {
    id: 7,
    title: 'Agriculture Science (Scientific Principles) | कृषि विज्ञान (वैज्ञानिक सिद्धांत)',
    note: 'Crop distribution/farming patterns belong to Geography. GM Crops/Tissue Culture/Agri-Biotech belong to Applied Science. Fertiliser chemistry belongs to Chemistry. | फसल वितरण/कृषि पैटर्न भूगोल में आते हैं। जीएम फसलें/टिश्यू कल्चर/कृषि-जैव प्रौद्योगिकी अनुप्रयुक्त विज्ञान में आती हैं। उर्वरक रसायन रसायन विज्ञान में आता है।',
    subtopics: [
      'Crop Types (Scientific Classification) | फसल प्रकार (वैज्ञानिक वर्गीकरण)',
      'Irrigation Methods (Scientific Principles) | सिंचाई विधियाँ (वैज्ञानिक सिद्धांत)',
      'Soil Science Basics | मृदा विज्ञान के मूलभूत सिद्धांत',
      'HYV Seeds | उच्च उपज वाले बीज (HYV)',
      'Biological Pest Control | जैविक कीट नियंत्रण',
    ],
  },
  {
    id: 8,
    title: 'Materials in Daily Use | दैनिक उपयोग की सामग्री',
    note: 'Polymer chemistry belongs to Chemistry. Nanomaterials/advanced/composite materials belong to Applied Science. | बहुलक रसायन रसायन विज्ञान में आता है। नैनो पदार्थ/उन्नत/समग्र सामग्री अनुप्रयुक्त विज्ञान में आती हैं।',
    subtopics: [
      'Glass | काँच',
      'Ceramics | सिरामिक',
      'Rubber (Applications) | रबर (अनुप्रयोग)',
      'Plastics (Applications) | प्लास्टिक (अनुप्रयोग)',
      'Common Industrial Materials | सामान्य औद्योगिक सामग्री',
    ],
  },
  {
    id: 9,
    title: 'Safety and Disaster Science | सुरक्षा और आपदा विज्ञान',
    note: 'Disaster management policy/institutional framework belongs to Geography/Polity. | आपदा प्रबंधन नीति/संस्थागत ढाँचा भूगोल/राजव्यवस्था में आता है।',
    subtopics: [
      'Fire Safety | अग्नि सुरक्षा',
      'Electrical Safety | विद्युत सुरक्षा',
      'Hazardous Chemical Handling | खतरनाक रसायनों का संचालन',
      'Laboratory Equipment Safety | प्रयोगशाला उपकरण सुरक्षा',
      'Personal Protective Equipment (PPE) | व्यक्तिगत सुरक्षा उपकरण (PPE)',
      'Earthquake Safety | भूकंप सुरक्षा',
      'Flood Safety | बाढ़ सुरक्षा',
      'Cyclone Safety | चक्रवात सुरक्षा',
    ],
  },
  {
    id: 10,
    title: 'Science Organisations and Awards | विज्ञान संगठन और पुरस्कार',
    note: 'ISRO, space missions and satellites belong to Space Science. | ISRO, अंतरिक्ष मिशन और उपग्रह अंतरिक्ष विज्ञान में आते हैं।',
    subtopics: [
      'DRDO | DRDO',
      'CSIR | CSIR',
      'ICMR | ICMR',
      'BARC | BARC',
      'DBT (Department of Biotechnology) | DBT (जैव प्रौद्योगिकी विभाग)',
      'Nobel Prize in Science | विज्ञान में नोबेल पुरस्कार',
      'Shanti Swarup Bhatnagar Award | शांति स्वरूप भटनागर पुरस्कार',
      'Other Important Scientific Organisations and Awards | अन्य महत्वपूर्ण वैज्ञानिक संगठन और पुरस्कार',
    ],
  },
  {
    id: 11,
    title: 'Miscellaneous General Science | विविध सामान्य विज्ञान',
    note: 'Question formats (Match the Following, Assertion-Reason, True/False, Statement-Based) are handled via a global question-tagging system, not as content topics here. | प्रश्न प्रारूप (मिलान, कथन-कारण, सही/गलत, कथन-आधारित) वैश्विक प्रश्न-टैगging प्रणाली से संभाले जाते हैं, यहाँ सामग्री विषय के रूप में नहीं।',
    subtopics: [
      'Scientific Terminology | वैज्ञानिक शब्दावली',
      'Fathers of Various Sciences | विभिन्न विज्ञानों के जनक',
      'Famous Scientific Facts | प्रसिद्ध वैज्ञानिक तथ्य',
      'Important Scientific Records | महत्वपूर्ण वैज्ञानिक रिकॉर्ड',
      'One-Liner Science GK | एक-पंक्ति विज्ञान GK',
      'Miscellaneous Science Facts | विविध विज्ञान तथ्य',
    ],
  },
];

export const GENERAL_SCIENCE_PAGE_TITLE = {
  en: 'General Science',
  hi: 'सामान्य विज्ञान',
};

export const GENERAL_SCIENCE_SECTION_LABEL = {
  en: 'General Science Topics',
  hi: 'सामान्य विज्ञान के विषय',
};

export const GENERAL_SCIENCE_SCOPE = {
  en: 'Scientific awareness, everyday science, scientific instruments, discoveries, health, safety and applied scientific concepts for competitive examinations.',
  hi: 'प्रतियोगी परीक्षाओं के लिए वैज्ञानिक जागरूकता, दैनिक विज्ञान, वैज्ञानिक उपकरण, खोजें, स्वास्थ्य, सुरक्षा और अनुप्रयुक्त वैज्ञानिक अवधारणाएँ।',
};
