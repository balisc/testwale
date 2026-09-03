import assert from 'node:assert/strict';
import {
  getExamPreferenceHref,
  isTrackSelectable,
  normalizeExamPreparationTrack,
  preferredTrackMatches,
  withExamStageQuery,
} from './examPreference';

const profileId = '11111111-1111-4111-8111-111111111111';
const cglTrack = normalizeExamPreparationTrack({
  exam_profile_id: profileId,
  content_exam_id: '22222222-2222-4222-8222-222222222222',
  exam_code: 'SSC_CGL',
  exam_slug: 'ssc-combined-graduate-level-examination',
  short_name: 'SSC CGL',
  display_title: { en: 'SSC CGL', hi: 'एसएससी सीजीएल' },
  tier_code: 'TIER_II',
  stage_code: 'TIER_II_PAPER_I',
  stage_title: { en: 'Tier 2', hi: 'टियर 2' },
  paper_or_section: { en: 'Paper I', hi: 'पेपर I' },
  preparation_mode: 'MCQ',
  is_objective: false,
  verified_question_count: '5000',
  qualifying_skill_test_count: '1',
  is_available: true,
  sort_order: '2',
});

assert.ok(cglTrack);
assert.equal(cglTrack.verifiedQuestionCount, 5000, 'PostgREST bigint strings are parsed safely');
assert.equal(cglTrack.qualifyingSkillTestCount, 1, 'DEST remains a separate skill-test count');
assert.equal(isTrackSelectable(cglTrack), true);
assert.equal(getExamPreferenceHref({
  examCode: cglTrack.examCode,
  examSlug: cglTrack.examSlug,
  tierCode: cglTrack.tierCode,
  stageCode: cglTrack.stageCode,
}), '/ssc-cgl/tier-2/paper-1/subjects');

const genericTrack = normalizeExamPreparationTrack({
  exam_profile_id: profileId,
  content_exam_id: '22222222-2222-4222-8222-222222222222',
  exam_code: 'MOCK_EXAM',
  exam_slug: 'mock-exam',
  short_name: 'Mock Exam',
  display_title: { en: 'Mock Exam', hi: 'मॉक परीक्षा' },
  tier_code: null,
  stage_code: 'MAINS_SECTION_A',
  stage_title: 'Mains',
  paper_or_section: 'Section A',
  preparation_mode: 'MCQ',
  is_objective: true,
  verified_question_count: 20,
  qualifying_skill_test_count: 0,
  is_available: true,
  sort_order: 1,
});
assert.ok(genericTrack);
assert.equal(getExamPreferenceHref({
  examCode: genericTrack.examCode,
  examSlug: genericTrack.examSlug,
  tierCode: genericTrack.tierCode,
  stageCode: genericTrack.stageCode,
}), '/exams/mock-exam?stage=MAINS_SECTION_A');
assert.equal(withExamStageQuery('/exams/mock-exam/math', 'MAINS_SECTION_A'), '/exams/mock-exam/math?stage=MAINS_SECTION_A');
assert.equal(preferredTrackMatches(genericTrack, {
  examProfileId: profileId,
  tierCode: null,
  stageCode: 'MAINS_SECTION_A',
  preparationMode: 'MCQ',
}), true);

assert.equal(getExamPreferenceHref({
  examCode: 'SSC_CHSL',
  examSlug: 'ssc-combined-higher-secondary-level-examination',
  tierCode: null,
  stageCode: 'TIER_I',
}), '/ssc-chsl/tier-1/subjects');
assert.equal(getExamPreferenceHref({
  examCode: 'SSC_CHSL',
  examSlug: 'ssc-combined-higher-secondary-level-examination',
  tierCode: null,
  stageCode: 'TIER_II',
}), '/ssc-chsl/tier-2/subjects');

assert.equal(normalizeExamPreparationTrack({
  exam_profile_id: profileId,
  exam_code: 'MOCK_EXAM',
  exam_slug: 'mock-exam',
  stage_code: 'WRITTEN',
  preparation_mode: 'WRITTEN',
}), null,
  'written content is not fabricated while the database has only an MCQ model');
assert.equal(normalizeExamPreparationTrack({
  exam_profile_id: profileId,
  exam_code: 'MOCK_EXAM',
  exam_slug: 'mock-exam',
  stage_code: 'PRELIMS',
  preparation_mode: 'MCQ',
  verified_question_count: 0,
  is_available: true,
})?.isAvailable, false);

console.log('exam preference tests passed');
