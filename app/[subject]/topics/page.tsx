import { permanentRedirect, redirect } from 'next/navigation';
import SubjectTopicsClient from '@/app/subjects/[subject]/SubjectTopicsClient';
import { slugifySubject } from '@/lib/slugGenerator';
import { fetchTopicsFromQuestions } from '@/lib/questionTopics';
import { PHYSICAL_GEOGRAPHY_PAGE_TITLE } from '@/lib/geography/physicalGeographyData';
import { INDIAN_GEOGRAPHY_PAGE_TITLE } from '@/lib/geography/indianGeographyData';
import { WORLD_GEOGRAPHY_PAGE_TITLE } from '@/lib/geography/worldGeographyData';
import { ENVIRONMENT_ECOLOGY_PAGE_TITLE } from '@/lib/geography/environmentEcologyData';
import { ECONOMIC_FUNDAMENTALS_PAGE_TITLE } from '@/lib/economics/economicFundamentalsData';
import { NATIONAL_INCOME_MACROECONOMICS_PAGE_TITLE } from '@/lib/economics/nationalIncomeMacroeconomicsData';
import { MONEY_BANKING_FINANCIAL_SYSTEM_PAGE_TITLE } from '@/lib/economics/moneyBankingFinancialSystemData';
import { PUBLIC_FINANCE_PAGE_TITLE } from '@/lib/economics/publicFinanceData';
import { INDIAN_ECONOMY_SECTORS_PAGE_TITLE } from '@/lib/economics/indianEconomySectorsData';
import { ECONOMIC_PLANNING_DEVELOPMENT_PAGE_TITLE } from '@/lib/economics/economicPlanningDevelopmentData';
import { EXTERNAL_SECTOR_PAGE_TITLE } from '@/lib/economics/externalSectorData';
import { INFLATION_EMPLOYMENT_POVERTY_PAGE_TITLE } from '@/lib/economics/inflationEmploymentPovertyData';
import { INTERNATIONAL_ECONOMIC_ORGANIZATIONS_PAGE_TITLE } from '@/lib/economics/internationalEconomicOrganizationsData';
import { NUMBER_SYSTEM_PAGE_TITLE } from '@/lib/math/numberSystemData';
import { ARITHMETIC_PAGE_TITLE } from '@/lib/math/arithmeticData';
import { ALGEBRA_PAGE_TITLE } from '@/lib/math/algebraData';
import { GEOMETRY_MENSURATION_PAGE_TITLE } from '@/lib/math/geometryMensurationData';
import { TRIGONOMETRY_PAGE_TITLE } from '@/lib/math/trigonometryData';
import { DATA_INTERPRETATION_PAGE_TITLE } from '@/lib/math/dataInterpretationData';
import { STATISTICS_PROBABILITY_PAGE_TITLE } from '@/lib/math/statisticsProbabilityData';
import { ADVANCED_MATHEMATICS_PAGE_TITLE } from '@/lib/math/advancedMathematicsData';
import { PHYSICS_PAGE_TITLE } from '@/lib/science/physicsData';
import { CHEMISTRY_PAGE_TITLE } from '@/lib/science/chemistryData';
import { BIOLOGY_PAGE_TITLE } from '@/lib/science/biologyData';
import { GENERAL_SCIENCE_PAGE_TITLE } from '@/lib/science/generalScienceData';
import { canonical } from '@/lib/seo';

const SUBJECT_TABLES: Record<string, { table: string; label: string }> = {
  history: { table: 'history_questions', label: 'History' },
  science: { table: 'science_questions', label: 'Science' },
  polity: { table: 'polity_questions', label: 'Polity' },
  economics: { table: 'economics_questions', label: 'Economics' },
  geography: { table: 'geography_questions', label: 'Geography' },
  'general-knowledge': { table: 'general_knowledge_questions', label: 'General Knowledge' },
  math: { table: 'math_questions', label: 'Math' },
  'current-affairs': { table: 'current_affairs_questions', label: 'Current Affairs' },
  reasoning: { table: 'reasoning_questions', label: 'Reasoning' },
};

const VALID_SUB_CATEGORIES = new Set(['ancient', 'medieval', 'modern']);

type SearchParams = {
  sub_category?: string | string[];
  topic?: string | string[];
  category?: string | string[];
};

function parseSearchValue(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.en === 'string' && parsed.en.trim().length > 0) {
        return parsed.en.trim();
      }
      if (typeof parsed.hi === 'string' && parsed.hi.trim().length > 0) {
        return parsed.hi.trim();
      }
    }
  } catch {
    // not JSON, fall back to raw string
  }

  return trimmed;
}

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

function extractTopicValues(row: any) {
  const rawTopic = row.topic;
  let en = '';
  let hi = '';
  let raw = '';

  if (rawTopic && typeof rawTopic === 'object') {
    en = String(rawTopic.en ?? rawTopic.hi ?? '').trim();
    hi = String(rawTopic.hi ?? rawTopic.en ?? '').trim();
    raw = JSON.stringify(rawTopic);
  } else if (typeof rawTopic === 'string') {
    raw = rawTopic.trim();
    en = raw;
    hi = raw;
    try {
      const parsed = JSON.parse(rawTopic);
      if (parsed && typeof parsed === 'object') {
        en = String(parsed.en ?? parsed.hi ?? rawTopic).trim();
        hi = String(parsed.hi ?? parsed.en ?? rawTopic).trim();
      }
    } catch {
      // Keep raw string values.
    }
  }

  const topicEn = String(row.topic_en ?? row.topic?.en ?? en ?? '').trim();
  const topicHi = String(row.topic_hi ?? row.topic?.hi ?? hi ?? '').trim();

  return {
    topicEn,
    topicHi,
    topicRaw: String(row.topic ?? row.topic_en ?? row.topic_hi ?? raw ?? '').trim(),
  };
}

async function fetchTopics(subjectKey: string, subCategory?: string) {
  return fetchTopicsFromQuestions(subjectKey, subCategory);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { subject } = await params;
  const resolvedSearchParams = await searchParams;
  const subjectKey = String(subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return {
      title: 'Topic not found',
      robots: { index: false, follow: true },
    };
  }

  const rawSubCategory = Array.isArray(resolvedSearchParams.sub_category)
    ? resolvedSearchParams.sub_category[0]
    : resolvedSearchParams.sub_category;
  const rawCategory = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;
  const category = rawCategory ? normalizeCategory(parseSearchValue(rawCategory)) : '';
  const subCategory = rawSubCategory ? normalizeCategory(parseSearchValue(rawSubCategory)) : '';

  const pageTitle =
    subjectKey === 'geography' && category === 'physical-geography'
      ? PHYSICAL_GEOGRAPHY_PAGE_TITLE.en
      : subjectKey === 'geography' && category === 'indian-geography'
      ? INDIAN_GEOGRAPHY_PAGE_TITLE.en
      : subjectKey === 'geography' && category === 'world-geography'
      ? WORLD_GEOGRAPHY_PAGE_TITLE.en
      : subjectKey === 'geography' && category === 'environment-ecology'
      ? ENVIRONMENT_ECOLOGY_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'economic-fundamentals'
      ? ECONOMIC_FUNDAMENTALS_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'national-income-macroeconomics'
      ? NATIONAL_INCOME_MACROECONOMICS_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'money-banking-financial-system'
      ? MONEY_BANKING_FINANCIAL_SYSTEM_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'public-finance'
      ? PUBLIC_FINANCE_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'indian-economy-sectors'
      ? INDIAN_ECONOMY_SECTORS_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'economic-planning-development'
      ? ECONOMIC_PLANNING_DEVELOPMENT_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'external-sector'
      ? EXTERNAL_SECTOR_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'inflation-employment-poverty'
      ? INFLATION_EMPLOYMENT_POVERTY_PAGE_TITLE.en
      : subjectKey === 'economics' && category === 'international-economic-organizations'
      ? INTERNATIONAL_ECONOMIC_ORGANIZATIONS_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'number-system'
      ? NUMBER_SYSTEM_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'arithmetic'
      ? ARITHMETIC_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'algebra'
      ? ALGEBRA_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'geometry-mensuration'
      ? GEOMETRY_MENSURATION_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'trigonometry'
      ? TRIGONOMETRY_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'data-interpretation'
      ? DATA_INTERPRETATION_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'statistics-probability'
      ? STATISTICS_PROBABILITY_PAGE_TITLE.en
      : subjectKey === 'math' && category === 'advanced-mathematics'
      ? ADVANCED_MATHEMATICS_PAGE_TITLE.en
      : subjectKey === 'science' && category === 'physics'
      ? PHYSICS_PAGE_TITLE.en
      : subjectKey === 'science' && category === 'chemistry'
      ? CHEMISTRY_PAGE_TITLE.en
      : subjectKey === 'science' && category === 'biology'
      ? BIOLOGY_PAGE_TITLE.en
      : subjectKey === 'science' && category === 'general-science'
      ? GENERAL_SCIENCE_PAGE_TITLE.en
      : subCategory
      ? `${subjectConfig.label} - ${subCategory.charAt(0).toUpperCase() + subCategory.slice(1)} Topics`
      : `${subjectConfig.label} Topics`;

  return {
    title: pageTitle,
    description: subCategory
      ? `Browse ${subCategory} ${subjectConfig.label} topics and practice questions.`
      : `Browse ${subjectConfig.label} topics and practice questions.`,
    ...canonical(`/${subjectKey}/topics`),
    openGraph: {
      title: subCategory
        ? `${subjectConfig.label} - ${subCategory.charAt(0).toUpperCase() + subCategory.slice(1)} Topics`
        : `${subjectConfig.label} Topics`,
      description: subCategory
        ? `Browse ${subCategory} ${subjectConfig.label} topics and practice questions.`
        : `Browse ${subjectConfig.label} topics and practice questions.`,
      url: `/${subjectKey}/topics`,
      type: 'website',
      siteName: 'Questionwale',
    },
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { subject } = await params;
  const resolvedSearchParams = await searchParams;
  const subjectKey = String(subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return redirect('/subjects');
  }

  const rawSubCategory = Array.isArray(resolvedSearchParams.sub_category)
    ? resolvedSearchParams.sub_category[0]
    : resolvedSearchParams.sub_category;
  const rawCategory = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;
  const rawTopic = Array.isArray(resolvedSearchParams.topic) ? resolvedSearchParams.topic[0] : resolvedSearchParams.topic;

  const subCategory = rawSubCategory ? normalizeCategory(parseSearchValue(rawSubCategory)) : '';
  const category = rawCategory ? normalizeCategory(parseSearchValue(rawCategory)) : '';
  const topicValue = rawTopic ? parseSearchValue(rawTopic) : '';

  if (subjectKey === 'geography' && category === 'maps-geographic-locations') {
    return permanentRedirect('/map-practice');
  }

  if (topicValue && !subCategory) {
    const normalizedSlug = slugifySubject(topicValue);
    return permanentRedirect(`/${subjectKey}/topics/${encodeURIComponent(normalizedSlug)}`);
  }

  const validSubCategory = VALID_SUB_CATEGORIES.has(subCategory) ? subCategory : undefined;
  const topics = await fetchTopics(subjectKey, validSubCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
        <SubjectTopicsClient
          subjectKey={subjectKey}
          topics={topics}
          subCategory={validSubCategory}
          category={category || undefined}
        />
      </div>
    </div>
  );
}
