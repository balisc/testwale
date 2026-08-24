-- Explicitly link the current SSC CGL syllabus taxonomy to question-backed
-- catalog subtopics. Safe to re-run. This script does not create or modify
-- questions; it only stores verified stable content references in node metadata.
--
-- Apply manually in Supabase SQL Editor. Do not run against an unreviewed schema.

begin;

do $preflight$
begin
  if to_regclass('public.exam_profiles') is null
     or to_regclass('public.exam_syllabus_versions') is null
     or to_regclass('public.exam_syllabus_nodes') is null
     or to_regclass('public.subtopics') is null
     or to_regclass('public.questions') is null
     or to_regclass('public.question_exam_profile_mappings') is null then
    raise exception 'SSC CGL content-link migration prerequisites are missing';
  end if;
end
$preflight$;

create temporary table qw_ssc_cgl_content_links (
  node_code text primary key,
  content_subtopic_slug text not null
) on commit drop;

insert into qw_ssc_cgl_content_links (node_code, content_subtopic_slug)
values
    ('COMP_BACKUP_DEVICES', 'backup-devices'),
    ('COMP_CPU', 'central-processing-unit-cpu'),
    ('COMP_DOWNLOADING_UPLOADING', 'downloading-and-uploading'),
    ('COMP_EBANKING', 'e-banking'),
    ('COMP_EMAIL_ACCOUNT', 'managing-an-email-account'),
    ('COMP_INPUT_OUTPUT', 'input-and-output-devices'),
    ('COMP_KEYBOARD_SHORTCUTS', 'keyboard-shortcuts'),
    ('COMP_MALWARE_THREATS', 'hacking-viruses-worms-and-trojans'),
    ('COMP_MEMORY', 'computer-memory'),
    ('COMP_MEMORY_ORGANIZATION', 'memory-organization'),
    ('COMP_MS_EXCEL', 'microsoft-excel'),
    ('COMP_MS_POWERPOINT', 'microsoft-powerpoint'),
    ('COMP_MS_WORD', 'microsoft-word'),
    ('COMP_NETWORK_PROTOCOLS', 'network-protocols'),
    ('COMP_NETWORK_SECURITY_THREATS', 'network-security-threats'),
    ('COMP_NETWORKING_DEVICES', 'networking-devices'),
    ('COMP_ORGANIZATION', 'organization-of-a-computer'),
    ('COMP_PORTS', 'computer-ports'),
    ('COMP_PREVENTIVE_MEASURES', 'preventive-security-measures'),
    ('COMP_WEB_BROWSING_SEARCHING', 'web-browsing-and-searching'),
    ('COMP_WINDOWS_EXPLORER', 'windows-explorer'),
    ('COMP_WINDOWS_OS', 'windows-operating-system'),
    ('ENG_ACTIVE_PASSIVE', 'active-and-passive-voice-of-verbs'),
    ('ENG_ANTONYMS', 'antonyms'),
    ('ENG_BASIC_COMPREHENSION', 'basic-comprehension'),
    ('ENG_BASIC_WRITING_ABILITY_SCOPE', 'basic-writing-ability'),
    ('ENG_CLOZE_PASSAGE', 'cloze-passage'),
    ('ENG_COMPREHENSION_PASSAGE', 'comprehension-passage'),
    ('ENG_CORRECT_WORD_USAGE', 'correct-usage-of-synonyms-and-antonyms'),
    ('ENG_CURRENT_AFFAIRS_PASSAGES', 'current-affairs-passages-based-on-a-report-or-editorial'),
    ('ENG_DIRECT_INDIRECT', 'direct-and-indirect-narration'),
    ('ENG_FILL_BLANKS', 'fill-in-the-blanks'),
    ('ENG_GRAMMAR', 'grammar'),
    ('ENG_HOMONYMS', 'homonyms'),
    ('ENG_IDIOMS_PHRASES', 'idioms-and-phrases'),
    ('ENG_ONE_WORD_SUBSTITUTION', 'one-word-substitution'),
    ('ENG_SENTENCE_IMPROVEMENT', 'improvement-of-sentences'),
    ('ENG_SENTENCE_STRUCTURE', 'sentence-structure'),
    ('ENG_SHUFFLING_PASSAGE_SENTENCES', 'shuffling-of-sentences-in-a-passage'),
    ('ENG_SHUFFLING_SENTENCE_PARTS', 'shuffling-of-sentence-parts'),
    ('ENG_SIMPLE_BOOK_STORY_PASSAGE', 'simple-passage-based-on-a-book-or-story'),
    ('ENG_SPELLINGS', 'spellings-and-detecting-misspelt-words'),
    ('ENG_SPOT_ERROR', 'spot-the-error'),
    ('ENG_SYNONYMS', 'synonyms'),
    ('ENG_UNDERSTANDING_CORRECT_ENGLISH', 'understanding-correct-english'),
    ('ENG_VOCABULARY_GENERAL', 'vocabulary'),
    ('FE_ACCOUNTING_CONCEPTS_CONVENTIONS', 'basic-accounting-concepts-and-conventions'),
    ('FE_BALANCE_PAYMENTS', 'balance-of-payments'),
    ('FE_BALANCE_SHEET', 'balance-sheet'),
    ('FE_BANK_RECONCILIATION', 'bank-reconciliation'),
    ('FE_BILLS_EXCHANGE', 'bills-of-exchange'),
    ('FE_BOOKS_ORIGINAL_ENTRY', 'books-of-original-entry'),
    ('FE_BUDGET', 'budget'),
    ('FE_CAG_CONSTITUTIONAL_PROVISIONS', 'constitutional-provisions-relating-to-the-cag'),
    ('FE_CAG_ROLE_RESPONSIBILITY', 'role-and-responsibility-of-the-cag'),
    ('FE_CAPITAL_REVENUE_EXPENDITURE', 'distinction-between-capital-and-revenue-expenditure'),
    ('FE_CENTRAL_ECONOMIC_PROBLEMS', 'central-problems-of-an-economy'),
    ('FE_COMMERCIAL_BANK_FUNCTIONS', 'functions-of-commercial-banks'),
    ('FE_CONSUMER_BEHAVIOUR_INDIFFERENCE_CURVE', 'consumer-behaviour-indifference-curve-approach'),
    ('FE_CONSUMER_BEHAVIOUR_MARSHALLIAN', 'consumer-behaviour-marshallian-approach'),
    ('FE_DEMAND_ELASTICITIES', 'elasticity-of-demand-price-income-and-cross-elasticity'),
    ('FE_DEMAND_MEANING_DETERMINANTS', 'meaning-and-determinants-of-demand'),
    ('FE_DEPRECIATION_ACCOUNTING', 'depreciation-accounting'),
    ('FE_DISINVESTMENT', 'disinvestment'),
    ('FE_ECONOMICS_DEFINITION', 'definition-of-economics'),
    ('FE_ECONOMICS_NATURE', 'nature-of-economics'),
    ('FE_ECONOMICS_SCOPE', 'scope-of-economics'),
    ('FE_ELASTICITY_SUPPLY', 'elasticity-of-supply'),
    ('FE_FACTORS_PRODUCTION', 'factors-of-production'),
    ('FE_FINANCE_COMMISSION_ROLE_FUNCTIONS', 'role-and-functions-of-the-finance-commission'),
    ('FE_FINANCIAL_ACCOUNTING_LIMITATIONS', 'limitations-of-financial-accounting'),
    ('FE_FINANCIAL_ACCOUNTING_NATURE_SCOPE', 'nature-and-scope-of-financial-accounting'),
    ('FE_FISCAL_DEFICITS', 'fiscal-deficits'),
    ('FE_FISCAL_POLICY', 'fiscal-policy'),
    ('FE_FRBM_ACT_2003', 'fiscal-responsibility-and-budget-management-act-2003'),
    ('FE_GAAP', 'generally-accepted-accounting-principles'),
    ('FE_GLOBALISATION', 'globalisation'),
    ('FE_INCOME_EXPENDITURE_ACCOUNT', 'income-and-expenditure-account'),
    ('FE_INDIAN_ECONOMY_NATURE', 'nature-of-the-indian-economy'),
    ('FE_INFRASTRUCTURE_COMMUNICATION', 'infrastructure-communication'),
    ('FE_INFRASTRUCTURE_ENERGY', 'infrastructure-energy'),
    ('FE_INFRASTRUCTURE_TRANSPORTATION', 'infrastructure-transportation'),
    ('FE_INVENTORY_VALUATION', 'valuation-of-inventories'),
    ('FE_IT_GOVERNANCE_ROLE', 'role-of-information-technology-in-governance'),
    ('FE_JOURNAL', 'journal'),
    ('FE_LAW_DEMAND', 'law-of-demand'),
    ('FE_LAW_SUPPLY', 'law-of-supply'),
    ('FE_LAW_VARIABLE_PROPORTIONS', 'law-of-variable-proportions'),
    ('FE_LEDGERS', 'ledgers'),
    ('FE_LIBERALISATION', 'liberalisation'),
    ('FE_MANUFACTURING_ACCOUNT', 'manufacturing-account'),
    ('FE_METHODS_ECONOMIC_STUDY', 'methods-of-economic-study'),
    ('FE_MONETARY_POLICY', 'monetary-policy'),
    ('FE_MONOPOLISTIC_COMPETITION', 'monopolistic-competition'),
    ('FE_MONOPOLY', 'monopoly'),
    ('FE_NATIONAL_INCOME_CONCEPTS', 'concepts-of-national-income'),
    ('FE_NATIONAL_INCOME_MEASUREMENT', 'methods-of-measuring-national-income'),
    ('FE_NON_PROFIT_ACCOUNTS', 'accounts-of-non-profit-organisations'),
    ('FE_OLIGOPOLY', 'oligopoly'),
    ('FE_PAYMENT_BANK_FUNCTIONS', 'functions-of-payment-banks'),
    ('FE_PERFECT_COMPETITION', 'perfect-competition'),
    ('FE_POPULATION_ECONOMIC_GROWTH', 'implications-of-population-for-economic-growth'),
    ('FE_POPULATION_SIZE_GROWTH', 'population-size-and-rate-of-growth'),
    ('FE_POVERTY', 'absolute-and-relative-poverty'),
    ('FE_PRICE_DETERMINATION_MARKETS', 'price-determination-in-different-markets'),
    ('FE_PRIVATISATION', 'privatisation'),
    ('FE_PRODUCTION_MEANING', 'meaning-of-production'),
    ('FE_PRODUCTION_POSSIBILITY_CURVE', 'production-possibilities-curve'),
    ('FE_PROFIT_LOSS_APPROPRIATION', 'profit-and-loss-appropriation-account'),
    ('FE_RBI_ROLE_FUNCTIONS', 'role-and-functions-of-the-reserve-bank-of-india'),
    ('FE_RECEIPTS_PAYMENTS_ACCOUNT', 'receipts-and-payments-account'),
    ('FE_RECTIFICATION_ERRORS', 'rectification-of-errors'),
    ('FE_REFORMS_SINCE_1991', 'economic-reforms-since-1991'),
    ('FE_RETURNS_TO_SCALE', 'laws-of-returns-to-scale'),
    ('FE_ROLE_AGRICULTURE', 'role-of-agriculture-in-the-indian-economy'),
    ('FE_ROLE_INDUSTRY', 'role-of-industry-in-the-indian-economy'),
    ('FE_ROLE_SERVICES', 'role-of-services-in-the-indian-economy'),
    ('FE_RRB_FUNCTIONS', 'functions-of-regional-rural-banks'),
    ('FE_SECTOR_PROBLEMS_GROWTH', 'problems-and-growth-of-agriculture-industry-and-services'),
    ('FE_SELF_BALANCING_LEDGERS', 'self-balancing-ledgers'),
    ('FE_SINGLE_DOUBLE_ENTRY', 'single-and-double-entry'),
    ('FE_SUPPLY_MEANING_DETERMINANTS', 'meaning-and-determinants-of-supply'),
    ('FE_TRADING_ACCOUNT', 'trading-account'),
    ('FE_TRIAL_BALANCE', 'trial-balance'),
    ('FE_UNEMPLOYMENT', 'types-causes-and-incidence-of-unemployment'),
    ('GA_AWARDS_BOOKS_AUTHORS_STATIC', 'awards-books-authors-static'),
    ('GA_CULTURE_ART_ARCHITECTURE_HERITAGE', 'art-architecture-heritage-sites'),
    ('GA_CULTURE_DANCE_THEATRE_FOLK', 'dance-theatre-folk-martial-traditions'),
    ('GA_CULTURE_FESTIVALS_FAIRS_PRACTICES', 'festivals-fairs-cultural-practices'),
    ('GA_CULTURE_LITERATURE_LANGUAGES_AUTHORS', 'literature-texts-languages-authors'),
    ('GA_CULTURE_MUSIC_INSTRUMENTS', 'indian-music-musical-instruments'),
    ('GA_CULTURE_NEIGHBORING_COUNTRIES', 'culture-neighbouring-countries'),
    ('GA_CULTURE_RELIGION_PHILOSOPHY_TRADITIONS', 'religion-philosophy-cultural-traditions'),
    ('GA_CULTURE_VISUAL_ARTS_CRAFTS_CINEMA', 'visual-arts-crafts-cinema'),
    ('GA_CURRENT_APPOINTMENTS_PERSONS', 'appointments-persons-in-news'),
    ('GA_CURRENT_INTERNATIONAL_AFFAIRS', 'international-current-affairs-relations'),
    ('GA_CURRENT_NATIONAL_AFFAIRS', 'national-current-affairs'),
    ('GA_CURRENT_REPORTS_INDICES_RANKINGS', 'reports-indices-rankings'),
    ('GA_CURRENT_SCHEMES_POLICY_UPDATES', 'government-schemes-policy-updates'),
    ('GA_CURRENT_SCIENCE_TECH_ENVIRONMENT', 'science-technology-environment-current-affairs'),
    ('GA_CURRENT_SPORTS_AWARDS_CULTURE', 'sports-awards-cultural-current-affairs'),
    ('GA_DAYS_SYMBOLS_FIRSTS_PERSONALITIES', 'days-symbols-firsts-personalities'),
    ('GA_ECONOMY_AGRICULTURE_INDUSTRY_SERVICES', 'agriculture-industry-services'),
    ('GA_ECONOMY_BASIC_CONCEPTS', 'basic-economic-concepts'),
    ('GA_ECONOMY_BUDGET_TAX_FISCAL_POLICY', 'budget-taxation-fiscal-policy'),
    ('GA_ECONOMY_EXTERNAL_TRADE_INSTITUTIONS', 'external-sector-trade-economic-institutions'),
    ('GA_ECONOMY_FINANCIAL_MARKETS_INSURANCE', 'financial-markets-securities-insurance'),
    ('GA_ECONOMY_INFLATION_EMPLOYMENT_POVERTY', 'inflation-employment-poverty-inequality'),
    ('GA_ECONOMY_MONEY_BANKING_RBI', 'money-banking-rbi'),
    ('GA_ECONOMY_NATIONAL_INCOME_GDP_GROWTH', 'national-income-gdp-growth'),
    ('GA_ECONOMY_PLANNING_DEVELOPMENT_REFORMS', 'planning-development-economic-reforms'),
    ('GA_GEOGRAPHY_AGRICULTURE_MINERALS_RESOURCES', 'agriculture-minerals-natural-resources'),
    ('GA_GEOGRAPHY_CLIMATE_SOILS_VEGETATION', 'climate-soils-natural-vegetation'),
    ('GA_GEOGRAPHY_INDIAN_PHYSIOGRAPHY_REGIONS', 'indian-physiography-regional-divisions'),
    ('GA_GEOGRAPHY_LOCATIONS_TRANSPORT_NEIGHBORS', 'locations-transport-neighbouring-countries'),
    ('GA_GEOGRAPHY_PHYSICAL_PROCESSES_LANDFORMS', 'physical-processes-landforms'),
    ('GA_GEOGRAPHY_POPULATION_SETTLEMENTS', 'population-settlements-human-geography'),
    ('GA_GEOGRAPHY_RIVERS_LAKES_DRAINAGE', 'rivers-lakes-drainage-water-resources'),
    ('GA_HISTORY_1857_NATIONAL_MOVEMENT', 'revolt-1857-national-movement'),
    ('GA_HISTORY_ANCIENT_INDIA', 'ancient-india'),
    ('GA_HISTORY_COMPANY_COLONIAL_TO_1857', 'company-rule-colonial-expansion-to-1857'),
    ('GA_HISTORY_MEDIEVAL_INDIA', 'medieval-india'),
    ('GA_HISTORY_POST_INDEPENDENCE_NEIGHBORS', 'post-independence-neighbouring-historical-links'),
    ('GA_HISTORY_SOCIO_RELIGIOUS_REFORMS', 'socio-religious-reform-movements'),
    ('GA_NATIONAL_INTERNATIONAL_ORGANIZATIONS', 'national-international-organizations'),
    ('GA_POLICY_CONSTITUTIONAL_FRAMEWORK', 'constitutional-framework-sources'),
    ('GA_POLICY_CONSTITUTIONAL_STATUTORY_BODIES', 'constitutional-statutory-bodies'),
    ('GA_POLICY_ELECTIONS_CITIZENSHIP_LAWS', 'elections-citizenship-emergency-laws-governance'),
    ('GA_POLICY_FEDERAL_STATE_LOCAL_GOVERNMENT', 'federalism-state-local-government'),
    ('GA_POLICY_JUDICIARY_WRITS', 'judiciary-writs'),
    ('GA_POLICY_PARLIAMENT_LEGISLATIVE_PROCESS', 'parliament-legislative-process'),
    ('GA_POLICY_RIGHTS_DPSP_DUTIES', 'fundamental-rights-dpsp-duties'),
    ('GA_POLICY_UNION_EXECUTIVE', 'union-executive'),
    ('GA_PUBLIC_HEALTH_EDUCATION_DEVELOPMENT', 'public-health-education-human-development'),
    ('GA_RESEARCH_BIOTECH_MEDICAL', 'biotechnology-medical-research'),
    ('GA_RESEARCH_DEFENCE_ENGINEERING_EMERGING', 'defence-engineering-emerging-technologies'),
    ('GA_RESEARCH_DISCOVERIES_INVENTIONS_AWARDS', 'discoveries-inventions-science-awards'),
    ('GA_RESEARCH_INDIAN_SCIENTISTS_INSTITUTIONS', 'indian-scientists-scientific-institutions'),
    ('GA_RESEARCH_NUCLEAR_ENERGY', 'nuclear-energy-research'),
    ('GA_RESEARCH_SPACE_ASTRONOMY', 'space-astronomy-research'),
    ('GA_SCIENCE_ASTRONOMY_SOLAR_SYSTEM', 'astronomy-solar-system-stable-science'),
    ('GA_SCIENCE_BOTANY_PLANT_PHYSIOLOGY_AGRICULTURE', 'botany-plant-physiology-agriculture'),
    ('GA_SCIENCE_CELL_CLASSIFICATION_GENETICS', 'cell-biology-classification-genetics'),
    ('GA_SCIENCE_CHEMISTRY_MATERIALS_REACTIONS', 'chemistry-materials-everyday-reactions'),
    ('GA_SCIENCE_COMPUTER_DIGITAL_BASICS', 'computer-digital-basics-general-awareness'),
    ('GA_SCIENCE_ECOLOGY_BIODIVERSITY_POLLUTION', 'ecology-biodiversity-pollution'),
    ('GA_SCIENCE_HEAT_LIGHT_SOUND_ELECTRICITY', 'heat-light-sound-electricity'),
    ('GA_SCIENCE_HUMAN_BODY_HEALTH_NUTRITION', 'human-body-health-nutrition'),
    ('GA_SCIENCE_MECHANICS_GRAVITATION', 'mechanics-motion-gravitation'),
    ('GA_SCIENCE_UNITS_MEASUREMENTS_INSTRUMENTS', 'units-measurements-scientific-instruments'),
    ('GA_SOCIAL_WELFARE_PUBLIC_SERVICES', 'social-welfare-public-services'),
    ('GA_SPORTS_GAMES_STATIC', 'sports-and-games-static'),
    ('MATH_AVERAGES', 'averages'),
    ('MATH_BASIC_ALGEBRAIC_IDENTITIES', 'basic-algebraic-identities-of-school-algebra'),
    ('MATH_DISCOUNT', 'discount'),
    ('MATH_ELEMENTARY_SURDS', 'elementary-surds'),
    ('MATH_HEMISPHERES', 'hemispheres'),
    ('MATH_INTEREST', 'interest'),
    ('MATH_LINEAR_EQUATION_GRAPHS', 'graphs-of-linear-equations'),
    ('MATH_MEAN', 'mean'),
    ('MATH_MEDIAN', 'median'),
    ('MATH_MENSURATION_CIRCLE', 'circle'),
    ('MATH_MENSURATION_QUADRILATERALS', 'quadrilaterals'),
    ('MATH_MENSURATION_REGULAR_POLYGONS', 'regular-polygons'),
    ('MATH_MENSURATION_TRIANGLE', 'triangle'),
    ('MATH_MIXTURE_ALLIGATION', 'mixture-and-alligation'),
    ('MATH_MODE', 'mode'),
    ('MATH_NUMBER_RELATIONSHIPS', 'relationships-between-numbers'),
    ('MATH_PARTNERSHIP', 'partnership-business'),
    ('MATH_PERCENTAGES', 'percentages'),
    ('MATH_PROFIT_LOSS', 'profit-and-loss'),
    ('MATH_RECTANGULAR_PARALLELEPIPED', 'rectangular-parallelepiped'),
    ('MATH_REGULAR_RIGHT_PYRAMID', 'regular-right-pyramid-with-triangular-or-square-base'),
    ('MATH_RIGHT_CIRCULAR_CONE', 'right-circular-cone'),
    ('MATH_RIGHT_CIRCULAR_CYLINDER', 'right-circular-cylinder'),
    ('MATH_RIGHT_PRISM', 'right-prism'),
    ('MATH_SPHERE', 'sphere'),
    ('MATH_SQUARE_ROOTS', 'square-roots'),
    ('MATH_STANDARD_DEVIATION', 'standard-deviation'),
    ('MATH_TIME_DISTANCE', 'time-and-distance'),
    ('MATH_TIME_WORK', 'time-and-work'),
    ('MATH_TRIANGLES_CENTRES', 'triangles-and-their-various-kinds-of-centres'),
    ('MATH_WHOLE_NUMBERS', 'computation-of-whole-numbers'),
    ('REA_ADDRESS_MATCHING', 'address-matching'),
    ('REA_ANALYSIS', 'analysis'),
    ('REA_ARITHMETICAL_REASONING', 'arithmetical-reasoning'),
    ('REA_CENTRE_ROLL_CLASSIFICATION', 'centre-roll-classification'),
    ('REA_CODING_DECODING', 'coding-decoding'),
    ('REA_CRITICAL_THINKING', 'critical-thinking'),
    ('REA_DATE_CITY_MATCHING', 'date-city-matching'),
    ('REA_DECISION_MAKING', 'decision-making'),
    ('REA_DISCRIMINATION', 'discrimination'),
    ('REA_DRAWING_INFERENCES', 'drawing-inferences'),
    ('REA_EMBEDDED_FIGURES', 'embedded-figures'),
    ('REA_EMOTIONAL_INTELLIGENCE', 'emotional-intelligence'),
    ('REA_FIGURAL_CLASSIFICATION', 'figural-classification'),
    ('REA_FIGURAL_FOLDING_COMPLETION', 'figural-folding-completion'),
    ('REA_INDEXING', 'indexing'),
    ('REA_JUDGMENT', 'judgment'),
    ('REA_LETTER_NUMBER_CODING_CLASSIFICATION', 'letter-number-coding-classification'),
    ('REA_NUMBER_SERIES', 'arithmetic-number-series'),
    ('REA_NUMERICAL_OPERATIONS', 'numerical-operations'),
    ('REA_OBSERVATION', 'observation'),
    ('REA_PROBLEM_SOLVING', 'problem-solving'),
    ('REA_PUNCHED_HOLE_FOLDING', 'punched-hole-folding'),
    ('REA_RELATIONSHIP_CONCEPTS', 'relationship-concepts'),
    ('REA_SEMANTIC_CLASSIFICATION', 'semantic-classification'),
    ('REA_SEMANTIC_SERIES', 'semantic-series'),
    ('REA_SIMILARITIES_DIFFERENCES', 'similarities-differences'),
    ('REA_SOCIAL_INTELLIGENCE', 'social-intelligence'),
    ('REA_SPACE_ORIENTATION', 'space-orientation'),
    ('REA_SPACE_VISUALIZATION', 'space-visualization'),
    ('REA_STATEMENT_CONCLUSION', 'statement-conclusion'),
    ('REA_SYLLOGISTIC_REASONING', 'syllogistic-reasoning'),
    ('REA_SYMBOLIC_OPERATIONS', 'symbolic-operations'),
    ('REA_TRENDS', 'trends'),
    ('REA_VENN_DIAGRAMS', 'venn-diagrams'),
    ('REA_VISUAL_MEMORY', 'visual-memory'),
    ('REA_WORD_BUILDING', 'word-building'),
    ('STAT_ASSOCIATION_ATTRIBUTES', 'measures-of-association-of-attributes'),
    ('STAT_BASE_SHIFTING_SPLICING', 'base-shifting-and-splicing'),
    ('STAT_BAYES_THEOREM', 'bayes-theorem'),
    ('STAT_BINOMIAL_DISTRIBUTION', 'binomial-distribution'),
    ('STAT_CLUSTER_SAMPLING', 'cluster-sampling'),
    ('STAT_COMPOUND_PROBABILITY', 'compound-probability'),
    ('STAT_CONDITIONAL_PROBABILITY', 'conditional-probability'),
    ('STAT_CONFIDENCE_INTERVALS', 'confidence-intervals'),
    ('STAT_CONVENIENCE_SAMPLING', 'convenience-sampling'),
    ('STAT_COST_OF_LIVING_INDEX', 'cost-of-living-index-numbers'),
    ('STAT_DATA_CLASSIFICATION', 'classification-of-data'),
    ('STAT_DATA_COLLECTION_METHODS', 'methods-of-data-collection'),
    ('STAT_DECILES', 'deciles'),
    ('STAT_DIAGRAMMATIC_FREQUENCY', 'diagrammatic-presentation-of-frequency-distributions'),
    ('STAT_EXPECTATION_RANDOM_VARIABLE', 'expectation-of-a-random-variable'),
    ('STAT_EXPONENTIAL_DISTRIBUTION', 'exponential-distribution'),
    ('STAT_FREQUENCY_DISTRIBUTIONS', 'frequency-distributions'),
    ('STAT_GOOD_ESTIMATOR_PROPERTIES', 'properties-of-a-good-estimator'),
    ('STAT_GRAPHS_CHARTS', 'graphs-and-charts'),
    ('STAT_HIGHER_MOMENTS_RANDOM_VARIABLE', 'higher-moments-of-a-random-variable'),
    ('STAT_HYPOTHESIS_TESTING', 'testing-of-hypothesis-and-basic-concepts'),
    ('STAT_INDEPENDENT_EVENTS', 'independent-events'),
    ('STAT_INDEX_CONSTRUCTION', 'problems-in-construction-of-index-numbers'),
    ('STAT_INDEX_FORMULAE', 'different-formulae-of-index-numbers'),
    ('STAT_INDEX_MEANING', 'meaning-of-index-numbers'),
    ('STAT_INDEX_TYPES', 'types-of-index-numbers'),
    ('STAT_INDEX_USES', 'uses-of-index-numbers'),
    ('STAT_INTERVAL_ESTIMATION', 'interval-estimation'),
    ('STAT_JOINT_DISTRIBUTION', 'joint-distribution-of-two-discrete-random-variables'),
    ('STAT_KURTOSIS_MEANING_MEASURES', 'meaning-and-measures-of-kurtosis'),
    ('STAT_LEAST_SQUARES', 'least-squares-method'),
    ('STAT_MAXIMUM_LIKELIHOOD', 'maximum-likelihood-method'),
    ('STAT_MEAN', 'mean'),
    ('STAT_MEAN_DEVIATION', 'mean-deviation'),
    ('STAT_MEDIAN', 'median'),
    ('STAT_METHOD_OF_MOMENTS', 'method-of-moments'),
    ('STAT_MODE', 'mode'),
    ('STAT_MOMENT_RELATIONSHIPS', 'relationships-between-moments'),
    ('STAT_MULTIPHASE_SAMPLING', 'multiphase-sampling'),
    ('STAT_MULTIPLE_PARTIAL_CORRELATION', 'multiple-and-partial-correlation-three-variables-only'),
    ('STAT_MULTIPLE_REGRESSION', 'multiple-regression'),
    ('STAT_MULTISTAGE_SAMPLING', 'multistage-sampling'),
    ('STAT_NORMAL_DISTRIBUTION', 'normal-distribution'),
    ('STAT_ONE_WAY_ANOVA', 'analysis-of-one-way-classified-data'),
    ('STAT_PARAMETER_STATISTIC', 'parameter-and-statistic'),
    ('STAT_PERCENTILES', 'percentiles'),
    ('STAT_POINT_ESTIMATION', 'point-estimation'),
    ('STAT_POISSON_DISTRIBUTION', 'poisson-distribution'),
    ('STAT_POPULATION_SAMPLE', 'population-and-sample'),
    ('STAT_PRIMARY_SECONDARY_DATA', 'primary-and-secondary-data'),
    ('STAT_PROBABILITY_DEFINITIONS', 'different-definitions-of-probability'),
    ('STAT_PROBABILITY_FUNCTIONS', 'probability-functions'),
    ('STAT_PROBABILITY_MEANING', 'meaning-of-probability'),
    ('STAT_PURPOSIVE_SAMPLING', 'purposive-sampling'),
    ('STAT_QUARTILE_DEVIATION', 'quartile-deviation'),
    ('STAT_QUARTILES', 'quartiles'),
    ('STAT_QUOTA_SAMPLING', 'quota-sampling'),
    ('STAT_RANDOM_VARIABLE', 'random-variable'),
    ('STAT_RANGE', 'range'),
    ('STAT_RELATIVE_DISPERSION', 'measures-of-relative-dispersion'),
    ('STAT_SAMPLE_SIZE', 'sample-size-decisions'),
    ('STAT_SAMPLING_DISTRIBUTION', 'sampling-distribution-statement-only'),
    ('STAT_SAMPLING_NONSAMPLING_ERRORS', 'sampling-and-non-sampling-errors'),
    ('STAT_SCATTER_DIAGRAM', 'scatter-diagram'),
    ('STAT_SEASONAL_VARIATION', 'measurement-of-seasonal-variation-by-different-methods'),
    ('STAT_SIMPLE_CORRELATION', 'simple-correlation-coefficient'),
    ('STAT_SIMPLE_RANDOM_SAMPLING', 'simple-random-sampling'),
    ('STAT_SIMPLE_REGRESSION', 'simple-regression-lines'),
    ('STAT_SKEWNESS_MEANING', 'meaning-of-skewness'),
    ('STAT_SKEWNESS_MEASURES', 'measures-of-skewness'),
    ('STAT_SMALL_LARGE_SAMPLE_TESTS', 'small-sample-and-large-sample-tests'),
    ('STAT_SPEARMAN_RANK', 'spearman-s-rank-correlation'),
    ('STAT_STANDARD_DEVIATION', 'standard-deviation'),
    ('STAT_STRATIFIED_SAMPLING', 'stratified-sampling'),
    ('STAT_SYSTEMATIC_SAMPLING', 'systematic-sampling'),
    ('STAT_TABULATION', 'tabulation-of-data'),
    ('STAT_TIME_SERIES_COMPONENTS', 'components-of-time-series'),
    ('STAT_TREND_DETERMINATION', 'determination-of-trend-by-different-methods'),
    ('STAT_TWO_WAY_ANOVA', 'analysis-of-two-way-classified-data'),
    ('STAT_TYPES_MOMENTS', 'different-types-of-moments'),
    ('STAT_VARIANCE_RANDOM_VARIABLE', 'variance-of-a-random-variable'),
    ('STAT_Z_T_CHISQUARE_F_TESTS', 'tests-based-on-z-t-chi-square-and-f-statistics');

do $migration$
declare
  v_profile_id uuid;
  v_version_id uuid;
  v_version_code text;
  v_count integer;
begin
  select p.id
    into strict v_profile_id
  from public.exam_profiles p
  where p.code = 'SSC_CGL'
    and p.slug = 'ssc-combined-graduate-level-examination'
    and p.is_active = true;

  select v.id, v.version_code
    into strict v_version_id, v_version_code
  from public.exam_syllabus_versions v
  where v.exam_profile_id = v_profile_id
    and v.publication_status = 'published'
    and v.is_current = true;

  if v_version_code <> 'SSC_CGL_2026_OPERATIONAL_V6_1' then
    raise exception 'Expected SSC CGL version %, found %; regenerate and review links',
      'SSC_CGL_2026_OPERATIONAL_V6_1', v_version_code;
  end if;

  select count(*) into v_count from qw_ssc_cgl_content_links;
  if v_count <> 341 then
    raise exception 'Expected 341 node links, found %', v_count;
  end if;

  select count(*) into v_count
  from qw_ssc_cgl_content_links l
  left join public.exam_syllabus_nodes n
    on n.syllabus_version_id = v_version_id
   and n.node_type = 'subtopic'
   and n.node_code = l.node_code
   and n.is_active = true
  where n.id is null;
  if v_count <> 0 then
    raise exception '% mapped SSC CGL node codes are absent from the current taxonomy', v_count;
  end if;

  select count(*) into v_count
  from qw_ssc_cgl_content_links l
  left join public.subtopics s
    on s.slug = l.content_subtopic_slug
   and s.is_active = true
  where s.id is null;
  if v_count <> 0 then
    raise exception '% mapped content subtopic slugs are absent or inactive', v_count;
  end if;

  select count(*) into v_count
  from public.exam_syllabus_nodes n
  join qw_ssc_cgl_content_links l on l.node_code = n.node_code
  join public.subtopics s
    on s.slug = l.content_subtopic_slug
   and s.is_active = true
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.is_active = true
    and coalesce(
      nullif(n.metadata ->> 'content_subtopic_id', ''),
      nullif(n.metadata ->> 'catalog_subtopic_id', '')
    ) is not null
    and coalesce(
      nullif(n.metadata ->> 'content_subtopic_id', ''),
      nullif(n.metadata ->> 'catalog_subtopic_id', '')
    ) <> s.id::text;
  if v_count <> 0 then
    raise exception '% SSC CGL nodes already point at a different content subtopic', v_count;
  end if;

  with exact_content as (
    select distinct q.subtopic_id
    from public.questions q
    join public.question_exam_profile_mappings qm
      on qm.question_id = q.id
     and qm.exam_profile_id = v_profile_id
     and qm.is_active = true
    where q.is_active = true
      and q.is_verified = true
      and q.subtopic_id is not null
  ),
  mapped_content as (
    select distinct s.id
    from qw_ssc_cgl_content_links l
    join public.subtopics s
      on s.slug = l.content_subtopic_slug
     and s.is_active = true
  )
  select count(*) into v_count
  from exact_content e
  left join mapped_content m on m.id = e.subtopic_id
  where m.id is null;
  if v_count <> 0 then
    raise exception '% exact SSC CGL question subtopics are not covered by this mapping', v_count;
  end if;

  update public.exam_syllabus_nodes n
  set metadata = coalesce(n.metadata, '{}'::jsonb) || jsonb_build_object(
        'content_subtopic_id', s.id::text,
        'catalog_subtopic_id', s.id::text,
        'content_mapping_status', 'linked',
        'content_mapping_source', 'explicit_node_code_slug_v1',
        'content_mapping_version', 'SSC_CGL_EXACT_QUESTION_LINKS_V1'
      ),
      updated_at = now()
  from qw_ssc_cgl_content_links l
  join public.subtopics s
    on s.slug = l.content_subtopic_slug
   and s.is_active = true
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.node_code = l.node_code
    and n.is_active = true
    and (
      coalesce(n.metadata ->> 'content_subtopic_id', '') <> s.id::text
      or coalesce(n.metadata ->> 'catalog_subtopic_id', '') <> s.id::text
      or coalesce(n.metadata ->> 'content_mapping_status', '') <> 'linked'
    );

  select count(*) into v_count
  from public.exam_syllabus_nodes n
  join qw_ssc_cgl_content_links l on l.node_code = n.node_code
  join public.subtopics s
    on s.slug = l.content_subtopic_slug
   and s.is_active = true
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.is_active = true
    and n.metadata ->> 'content_subtopic_id' = s.id::text;
  if v_count <> 341 then
    raise exception 'SSC CGL content-link verification expected 341, found %', v_count;
  end if;
end
$migration$;

notify pgrst, 'reload schema';

commit;
