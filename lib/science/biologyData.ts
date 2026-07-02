import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export const BIOLOGY_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Cell Biology | कोशिका जीव विज्ञान',
    subtopics: [
      'Cell Structure | कोशिका संरचना',
      'Cell Organelles | कोशिका अंगक',
      'Plant Cell vs Animal Cell | पादप कोशिका बनाम जंतु कोशिका',
      'Cell Division (Mitosis and Meiosis Basics) | कोशिका विभाजन (समसूत्री और अर्धसूत्री विभाजन — मूलभूत)',
    ],
  },
  {
    id: 2,
    title: 'Biomolecules | जैव अणु',
    note: 'Covers biomolecules and the biochemical role of nutrients. Dietary sources and deficiency diseases are covered under Human Nutrition (Topic 3.5). | जैव अणुओं और पोषक तत्वों की जैव रासायनिक भूमिका को कवर करता है। आहार स्रोत और अपर्याप्तता रोग मानव पोषण (विषय 3.5) में शामिल हैं।',
    subtopics: [
      'Carbohydrates | शर्करा (कार्बohydrate)',
      'Proteins | प्रोटीन',
      'Fats (Lipids) | वसा (लिपिड)',
      'Vitamins | vitamins',
      'Minerals | खनिज लवण',
    ],
  },
  {
    id: 3,
    title: 'Classification of Living Organisms | जीवों का वर्गीकरण',
    subtopics: [
      'Five Kingdom Classification | पाँच-जगत वर्गीकरण',
      'Plants | पादप',
      'Animals | जंतु',
      'Microorganisms | सूक्ष्मजीव',
    ],
  },
  {
    id: 4,
    title: 'Plant Physiology | पादप क्रिया विज्ञान',
    subtopics: [
      'Photosynthesis | प्रकाश संश्लेषण',
      'Respiration in Plants | पादपों में श्वसन',
      'Transpiration | वाषोत्सर्जन',
      'Plant Hormones | पादप हार्मोन',
    ],
  },
  {
    id: 5,
    title: 'Human Nutrition and Digestive System | मानव पोषण और पाचन तंत्र',
    subtopics: [
      'Nutrition | पोषण',
      'Digestive Organs | पाचन अंग',
      'Digestive Enzymes | पाचक एंजाइम',
      'Absorption of Food | भोजन का अवशोषण',
      'Balanced Diet and Deficiency Diseases | संतुलित आहार और अपर्याप्तता रोग',
    ],
  },
  {
    id: 6,
    title: 'Human Respiratory System | मानव श्वसन तंत्र',
    subtopics: [
      'Breathing | श्वास',
      'Gas Exchange | गैस विनिमय',
      'Lungs | फेफड़े',
      'Respiratory Diseases | श्वसन रोग',
    ],
  },
  {
    id: 7,
    title: 'Human Circulatory System | मानव परिसंचरण तंत्र',
    subtopics: [
      'Heart | हृदय',
      'Blood | रक्त',
      'Blood Groups | रक्त समूह',
      'Blood Vessels | रक्त वाहिकाएँ',
    ],
  },
  {
    id: 8,
    title: 'Nervous System and Sense Organs | तंत्रिका तंत्र और इंद्रिय अंग',
    note: 'Covers the biological structure and function of the eye and ear as sense organs. Optical principles, defects of vision and lenses belong to Physics (Topic 1.10). | नेत्र और कान को इंद्रिय अंगों के रूप में उनकी जैविक संरचना और कार्य को कवर करता है। प्रकाशिक सिद्धांत, दृष्टि दोष और लेंस भौतिकी (विषय 1.10) में आते हैं।',
    subtopics: [
      'Brain | मस्तिष्क',
      'Spinal Cord | मेरु रज्जु',
      'Nerves | नसें',
      'Eye (Biological Function) | नेत्र (जैविक कार्य)',
      'Ear (Biological Function) | कान (जैविक कार्य)',
    ],
  },
  {
    id: 9,
    title: 'Endocrine System | अंतःस्रावी तंत्र',
    subtopics: [
      'Hormones | हार्मोन',
      'Pituitary Gland | पीयूष ग्रंथि',
      'Thyroid Gland | थायराइड ग्रंथि',
      'Pancreas, Insulin and Diabetes | अग्न्याशय, इंसुलिन और मधुमेह',
    ],
  },
  {
    id: 10,
    title: 'Reproduction | प्रजनन',
    subtopics: [
      'Asexual Reproduction | अलैंगिक प्रजनन',
      'Sexual Reproduction | लैंगिक प्रजनन',
      'Human Reproduction | मानव प्रजनन',
      'Reproductive Health | प्रजनन स्वास्थ्य',
    ],
  },
  {
    id: 11,
    title: 'Genetics and Heredity | आनुवंशिकी और वंशागति',
    subtopics: [
      'DNA | DNA',
      'Genes | जीन',
      'Chromosomes | गुणसूत्र',
      "Mendel's Laws of Inheritance | मेंडल के वंशागति के नियम",
    ],
  },
  {
    id: 12,
    title: 'Evolution | विकास',
    subtopics: [
      'Natural Selection | प्राकृतिक चयन',
      'Adaptation | अनुकूलन',
      'Speciation | जाति निर्माण',
      'Human Evolution (Basics) | मानव विकास (मूलभूत)',
    ],
  },
  {
    id: 13,
    title: 'Diseases and Immunity | रोग और प्रतिरक्षा',
    subtopics: [
      'Communicable Diseases | संक्रामक रोग',
      'Non-Communicable Diseases | गैर-संक्रामक रोग',
      'Vaccination | टीकाकरण',
      'Immune System | प्रतिरक्षा तंत्र',
    ],
  },
  {
    id: 14,
    title: 'Microbiology and Biotechnology | सूक्ष्म जीव विज्ञान और जैव प्रौद्योगिकी',
    note: 'Covers only the basic concepts of microorganisms and genetic engineering. Detailed biotechnology applications (GM Crops, Gene Therapy, Industrial Biotechnology, etc.) belong to Applied Science & Emerging Technologies. | केवल सूक्ष्मजीवों और आनुवंशिक अभियांत्रिकी के मूलभूत सिद्धांतों को कवर करता है। विस्तृत जैव प्रौद्योगिकी अनुप्रयोग (जीएम फसलें, जीन थेरेपी, औद्योगिक जैव प्रौद्योगिकी आदि) अनुप्रयुक्त विज्ञान और उभरती प्रौद्योगिकियों में आते हैं।',
    subtopics: [
      'Bacteria | जीवाणु',
      'Viruses | विषाणु',
      'Fungi | कवक',
      'Protozoa | प्रोटोजोआ',
      'Genetic Engineering (Basics) | आनुवंशिक अभियांत्रिकी (मूलभूत)',
    ],
  },
];

export const BIOLOGY_PAGE_TITLE = {
  en: 'Biology',
  hi: 'जीव विज्ञान',
};

export const BIOLOGY_SECTION_LABEL = {
  en: 'Biology Topics',
  hi: 'जीव विज्ञान के विषय',
};

export const BIOLOGY_SCOPE = {
  en: 'Life processes, cells, plants, animals, human body, genetics, evolution and diseases.',
  hi: 'जीवन प्रक्रियाएँ, कोशिकाएँ, पादप, जंतु, मानव शरीर, आनुवंशिकी, विकास और रोग।',
};
