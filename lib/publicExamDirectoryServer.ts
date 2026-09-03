import 'server-only';

import { unstable_cache } from 'next/cache';
import { getReadyExamSelectorOptions } from '@/lib/examCatalogueServer';
import { getPublicMockExamSummaries } from '@/lib/mockTests/showcaseServer';
import {
  buildPublicExamDirectory,
  type PublicExamDirectoryEntry,
} from '@/lib/publicExamDirectory';

async function loadPublicExamDirectory(): Promise<PublicExamDirectoryEntry[]> {
  const [options, mockSummaries] = await Promise.all([
    getReadyExamSelectorOptions(),
    getPublicMockExamSummaries(),
  ]);
  return buildPublicExamDirectory(options, mockSummaries);
}

const getCachedPublicExamDirectory = unstable_cache(
  loadPublicExamDirectory,
  ['public-exam-directory-v1'],
  { revalidate: 300, tags: ['exam-selector-options', 'mock-blueprints'] },
);

let lastKnownPublicExamDirectory: PublicExamDirectoryEntry[] = [];
const sharedServerState = globalThis as typeof globalThis & {
  __questionWalePublicExamDirectoryInFlight?: Promise<PublicExamDirectoryEntry[]>;
};

/** Shares the compact catalogue/blueprint read across concurrent route renders in one worker. */
export async function getPublicExamDirectoryStrict(): Promise<PublicExamDirectoryEntry[]> {
  const existing = sharedServerState.__questionWalePublicExamDirectoryInFlight;
  if (existing) return existing;

  const request = getCachedPublicExamDirectory();
  sharedServerState.__questionWalePublicExamDirectoryInFlight = request;
  try {
    return await request;
  } finally {
    if (sharedServerState.__questionWalePublicExamDirectoryInFlight === request) {
      delete sharedServerState.__questionWalePublicExamDirectoryInFlight;
    }
  }
}

/** Public UI fails closed on a transient catalogue outage and never exposes unfiltered rows. */
export async function getPublicExamDirectory(): Promise<PublicExamDirectoryEntry[]> {
  try {
    const exams = await getPublicExamDirectoryStrict();
    lastKnownPublicExamDirectory = exams;
    return exams;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'unknown_error');
    console.warn(`[public-exam-directory] ${message}`);
    return lastKnownPublicExamDirectory;
  }
}
