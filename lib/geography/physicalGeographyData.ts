export type StructuredTopicGroup = {
  id: number;
  title: string;
  subtopics: string[];
};

export const PHYSICAL_GEOGRAPHY_DATA: StructuredTopicGroup[] = [
  {
    id: 1,
    title: 'Earth in Space | पृथ्वी अंतरिक्ष में',
    subtopics: [
      'Universe | ब्रह्मांड',
      'Galaxy | गैलेक्सी',
      'Solar System | सौर मंडल',
      'Earth | पृथ्वी',
      'Shape & Size of Earth | पृथ्वी का आकार और परिमाण',
      'Origin of Earth & Solar System | पृथ्वी और सौर मंडल की उत्पत्ति',
    ],
  },
  {
    id: 2,
    title: 'Earth Movements & Mapping | पृथ्वी की गतियाँ और मानचित्रण',
    subtopics: [
      'Rotation & Revolution | परिक्रमण और परिभ्रमण',
      'Latitudes & Longitudes | अक्षांश और देशांतर',
      'Time & Time Zones | समय और समय क्षेत्र',
      'International Date Line | अंतर्राष्ट्रीय तिथि रेखा',
      'Map Scale | मानचित्र मापक',
      'Map Projections | मानचित्र प्रक्षेपण',
      'Coordinates & Grid System | निर्देशांक और ग्रिड प्रणाली',
    ],
  },
  {
    id: 3,
    title: 'Interior of the Earth | पृथ्वी का अंतर्भाग',
    subtopics: [
      'Interior Structure | अंतर्भाग संरचना',
      'Layers of Earth | पृथ्वी की परतें',
      'Seismic Waves | भूकंपीय तरंगें',
      "Earth's Magnetic Field | पृथ्वी का चुंबकीय क्षेत्र",
      'Isostasy | समस्तत्व',
      'Geothermal Gradient | भू-तापीय प्रवणता',
    ],
  },
  {
    id: 4,
    title: 'Rocks & Minerals | चट्टानें और खनिज',
    subtopics: [
      'Rocks | चट्टानें',
      'Rock Cycle | चट्टान चक्र',
      'Minerals | खनिज',
      'Economic Minerals | आर्थिक खनिज',
      'Mineral Resources | खनिज संसाधन',
      'Mineral Distribution | खनिज वितरण',
    ],
  },
  {
    id: 5,
    title: 'Soils | मृदा',
    subtopics: [
      'Soil Formation | मृदा निर्माण',
      'Soil Profile | मृदा प्रोफ़ाइल',
      'Soil Types | मृदा के प्रकार',
      'Soil Erosion | मृदा अपरदन',
      'Soil Conservation | मृदा संरक्षण',
      'Soil Fertility | मृदा उर्वरता',
    ],
  },
  {
    id: 6,
    title: 'Geomorphic Processes | भू-आकृति प्रक्रियाएँ',
    subtopics: [
      'Endogenic Forces | अंतर्जनित बल',
      'Exogenic Forces | बाह्यजनित बल',
      'Weathering | अपक्षय',
      'Erosion | अपरदन',
      'Deposition | जमाव',
      'Mass Wasting | द्रव्य पतन',
      'Geomorphic Cycle | भू-आकृति चक्र',
    ],
  },
  {
    id: 7,
    title: 'Plate Tectonics | प्लेट विवर्तनिकी',
    subtopics: [
      'Continental Drift | महाद्वीपीय विस्थापन',
      'Sea Floor Spreading | समुद्र तल विस्तार',
      'Plate Boundaries | प्लेट सीमाएँ',
      'Plate Tectonic Theory | प्लेट विवर्तनिकी सिद्धांत',
      'Hotspots | हॉटस्पॉट',
      'Plate Movements | प्लेट गतियाँ',
    ],
  },
  {
    id: 8,
    title: 'Earthquakes | भूकंप',
    subtopics: [
      'Causes | कारण',
      'Seismic Waves | भूकंपीय तरंगें',
      'Earthquake Zones | भूकंप क्षेत्र',
      'Measurement | मापन',
      'Effects | प्रभाव',
      'Disaster Mitigation | आपदा शमन',
    ],
  },
  {
    id: 9,
    title: 'Volcanoes | ज्वालामुखी',
    subtopics: [
      'Types | प्रकार',
      'Distribution | वितरण',
      'Volcanic Landforms | ज्वालामुखी भू-आकृतियाँ',
      'Volcanoes of the World | विश्व के ज्वालामुखी',
      'Effects | प्रभाव',
      'Disaster Mitigation | आपदा शमन',
    ],
  },
  {
    id: 10,
    title: 'Landforms | भू-आकृतियाँ',
    subtopics: [
      'Mountains | पर्वत',
      'Plateaus | पठार',
      'Plains | मैदान',
      'Desert Landforms | मरुस्थलीय भू-आकृतियाँ',
      'Fluvial Landforms | नदीय भू-आकृतियाँ',
      'Glacial Landforms | हिमनदीय भू-आकृतियाँ',
      'Aeolian Landforms | वायुज भू-आकृतियाँ',
      'Karst Landforms | कार्स्ट भू-आकृतियाँ',
      'Coastal Landforms | तटीय भू-आकृतियाँ',
    ],
  },
  {
    id: 11,
    title: 'Atmosphere | वायुमंडल',
    subtopics: [
      'Composition | संघटन',
      'Structure | संरचना',
      'Insolation | अंतःसूर्यन',
      'Heat Budget | ऊष्मा बजट',
      'Atmospheric Layers | वायुमंडलीय परतें',
      'Energy Balance | ऊर्जा संतुलन',
    ],
  },
  {
    id: 12,
    title: 'Atmospheric Elements | वायुमंडलीय तत्व',
    subtopics: [
      'Temperature | तापमान',
      'Atmospheric Pressure | वायुमंडलीय दाब',
      'Winds | पवन',
      'Humidity | आर्द्रता',
      'Clouds | बादल',
      'Rainfall | वर्षा',
    ],
  },
  {
    id: 13,
    title: 'Climate | जलवायु',
    subtopics: [
      'Climate Factors | जलवायु कारक',
      'Climatic Regions | जलवायु क्षेत्र',
      'Köppen Classification | कोपेन वर्गीकरण',
      'Thornthwaite Classification | थॉर्नथवेट वर्गीकरण',
      'Paleoclimate | पुराजलवायु',
      'Physical Causes of Climate Change | जलवायु परिवर्तन के भौतिक कारण',
    ],
  },
  {
    id: 14,
    title: 'Weather Systems | मौसम प्रणालियाँ',
    subtopics: [
      'Air Masses | वायु राशियाँ',
      'Fronts | मोर्चे',
      'Jet Streams | जेट स्ट्रीम',
      'Cyclones | चक्रवात',
      'Anticyclones | एंटीसाइक्लोन',
      'Local Winds | स्थानीय पवन',
    ],
  },
  {
    id: 15,
    title: 'Oceans | महासागर',
    subtopics: [
      'Major Oceans | प्रमुख महासागर',
      'Ocean Relief | महासागरीय राहत',
      'Ocean Water | महासागरीय जल',
      'Ocean Currents | महासागरीय धाराएँ',
      'Waves | लहरें',
      'Tides | ज्वार-भाटा',
      'Tsunami | सुनामी',
      'Coral Reefs | प्रवाल भित्तियाँ',
      'Marine Deposits | समुद्री जमाव',
    ],
  },
  {
    id: 16,
    title: 'Ocean–Atmosphere Phenomena | महासागर-वायुमंडल घटनाएँ',
    subtopics: [
      'El Niño | एल नीनो',
      'La Niña | ला नीना',
      'ENSO | ईएनएसओ',
      'Indian Ocean Dipole (IOD) | हिंद महासागर द्विध्रुव (IOD)',
      'Madden–Julian Oscillation (MJO) | मैडन-जूलियन दोलन (MJO)',
      'Western Disturbances | पश्चिमी विक्षोभ',
    ],
  },
  {
    id: 17,
    title: 'Natural Vegetation (World) | प्राकृतिक वनस्पति (विश्व)',
    subtopics: [
      'Vegetation Distribution Factors | वनस्पति वितरण के कारक',
      'Tropical Forests | उष्णकटिबंधीय वन',
      'Temperate Forests | समशीतोष्ण वन',
      'Grasslands | घास के मैदान',
      'Desert Vegetation | मरुस्थलीय वनस्पति',
      'Tundra Vegetation | टुंड्रा वनस्पति',
      'Mediterranean Vegetation | भूमध्यसागरीय वनस्पति',
      'Mountain Vegetation | पर्वतीय वनस्पति',
    ],
  },
];

export const PHYSICAL_GEOGRAPHY_PAGE_TITLE = {
  en: 'Physical Geography',
  hi: 'भौतिक भूगोल',
};

export const PHYSICAL_GEOGRAPHY_SECTION_LABEL = {
  en: 'Physical Geography Topics',
  hi: 'भौतिक भूगोल के विषय',
};
