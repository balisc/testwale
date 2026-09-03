import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildStrictPromotionPlan,
  strictQuestionKey,
  strictQuestionTextFingerprint,
  verifyStrictChslFacet,
  type StrictFacetRow,
  type StrictQuestionRow,
  type StrictVerificationContext,
} from './strictVerification';

function fixture() {
  const facet: StrictFacetRow = {
    id: '11111111-1111-4111-8111-111111111111',
    question_id: '22222222-2222-4222-8222-222222222222',
    blueprint_code: 'ssc-chsl-tier1-2025-v1',
    section_key: 'reasoning',
    bucket_key: 'logic_inference',
    difficulty_band: 'intermediate',
    question_type: null,
    event_date: null,
    group_id: null,
    group_order: null,
    reviewer_status: 'provisional',
    is_active: true,
    metadata: { topic_code: 'REASONING_VENN_INFERENCE', subtopic_code: 'REASONING_LOGICAL_VENN_DIAGRAM' },
    updated_at: '2026-08-26T10:00:00Z',
  };
  const question: StrictQuestionRow = {
    id: facet.question_id,
    subject_id: 'subject-1', topic_id: 'topic-1', subtopic_id: 'subtopic-1',
    question_text: { en: 'If all pens are tools, which conclusion follows?', hi: 'यदि सभी पेन उपकरण हैं, तो कौन-सा निष्कर्ष निकलता है?' },
    options: {
      A: { en: 'All tools are pens', hi: 'सभी उपकरण पेन हैं' },
      B: { en: 'Every pen is a tool', hi: 'प्रत्येक पेन एक उपकरण है' },
      C: { en: 'No pen is a tool', hi: 'कोई पेन उपकरण नहीं है' },
      D: { en: 'Some tools are not pens', hi: 'कुछ उपकरण पेन नहीं हैं' },
    },
    correct_option: 'B',
    explanation: {
      en: 'The statement directly establishes that every pen belongs to the set of tools.',
      hi: 'कथन सीधे स्थापित करता है कि प्रत्येक पेन उपकरणों के समूह में आता है।',
    },
    difficulty: 'intermediate',
    source: 'QuestionWale Original | Deterministic rule checked',
    source_metadata: {
      batch_key: 'qw_chsl_reasoning_batch_v1',
      question_key: 'qw_chsl_reasoning_logic_001',
      prepared_on: '2026-08-26',
      answer_proof: 'The premise is identical to option B.',
      relation_family: 'categorical_logic_direct',
      target_level: 'SSC CHSL',
      content_owner: 'QuestionWale',
      exam_profile_code: 'SSC_CHSL',
      question_type: 'original_practice_mcq',
      is_exact_pyq: false,
      originality: {
        template_generation: 'deterministic_rule_checked',
        independently_authored: true,
        third_party_question_bank_used: false,
        pyq_wording_copied: false,
        option_set_copied: false,
        copied_explanation: false,
        copied_illustration: false,
        external_asset_used: false,
      },
      syllabus_alignment: {
        stages: ['TIER_I'], exam_profile_code: 'SSC_CHSL', subject_code: 'SUBJ_REASONING',
        topic_code: 'REASONING_VENN_INFERENCE', subtopic_code: 'REASONING_LOGICAL_VENN_DIAGRAM',
      },
      option_rationales: {
        A: { en: 'Option A reverses the stated relationship and is therefore incorrect.', hi: 'विकल्प A दिए गए संबंध को उलटता है, इसलिए गलत है।', is_correct: false },
        B: { en: 'Option B states the premise exactly and is therefore correct.', hi: 'विकल्प B कथन को ठीक बताता है, इसलिए सही है।', is_correct: true },
        C: { en: 'Option C contradicts the stated relationship and is incorrect.', hi: 'विकल्प C दिए गए संबंध का विरोध करता है, इसलिए गलत है।', is_correct: false },
        D: { en: 'Option D is not guaranteed by the premise and is incorrect.', hi: 'विकल्प D कथन से निश्चित नहीं होता, इसलिए गलत है।', is_correct: false },
      },
    },
    is_active: true,
    is_verified: true,
    report_count: 0,
    updated_at: '2026-08-26T09:59:00Z',
  };
  const fingerprint = strictQuestionTextFingerprint(question.question_text, question.options);
  const questionKey = strictQuestionKey(question.source_metadata);
  const context: StrictVerificationContext = {
    mappedQuestionIds: new Set([question.id]),
    activeSubjectIds: new Set(['subject-1']),
    activeTopicIds: new Set(['topic-1']),
    activeSubtopicIds: new Set(['subtopic-1']),
    questionTextCounts: new Map([[fingerprint, 1]]),
    questionKeyCounts: new Map([[questionKey, 1]]),
    sourceRegistryKeys: new Set(),
    groupsById: new Map(),
    now: new Date('2026-09-02T00:00:00Z'),
  };
  return { facet, question, context };
}

test('strict CHSL verifier promotes only a complete deterministic question', () => {
  const { facet, question, context } = fixture();
  const result = verifyStrictChslFacet(facet, question, context);
  assert.equal(result.decision, 'promotable');
  assert.deepEqual(result.blockers, []);
  assert.match(result.contentHash, /^[a-f0-9]{64}$/);
  assert.equal(result.questionType, 'original_practice_mcq');
});

test('duplicate options and an inconsistent answer rationale fail closed', () => {
  const { facet, question, context } = fixture();
  const options = question.options as Record<string, { en: string; hi: string }>;
  options.D = { ...options.C };
  const metadata = question.source_metadata as Record<string, unknown>;
  const rationales = metadata.option_rationales as Record<string, Record<string, unknown>>;
  rationales.A.is_correct = true;
  const result = verifyStrictChslFacet(facet, question, context);
  assert.equal(result.decision, 'hold');
  assert.ok(result.blockers.includes('ENGLISH_OPTIONS_DUPLICATE'));
  assert.ok(result.blockers.includes('HINDI_OPTIONS_DUPLICATE'));
  assert.ok(result.blockers.includes('ANSWER_RATIONALE_MISMATCH'));
});

test('source-grounded content requires every referenced registry key', () => {
  const { facet, question, context } = fixture();
  facet.section_key = 'general_awareness';
  facet.bucket_key = 'polity';
  facet.metadata = { topic_code: 'GA_GENERAL_POLICY', subtopic_code: 'GA_CONSTITUTION' };
  const metadata = question.source_metadata as Record<string, unknown>;
  const originality = metadata.originality as Record<string, unknown>;
  originality.template_generation = 'source_grounded_deterministic_reauthoring';
  metadata.source_registry_keys = ['CONSTITUTION_INDIA'];
  metadata.source_checked_on = '2026-08-25';
  metadata.evidence_locator = { claim_level_support: true, target_fact: 'A supported constitutional fact', source_fact_pool: 'POLITY_FACTS' };
  metadata.syllabus_alignment = {
    stages: ['TIER_I'], exam_profile_code: 'SSC_CHSL', subject_code: 'SUBJ_GENERAL_AWARENESS',
    topic_code: 'GA_GENERAL_POLICY', subtopic_code: 'GA_CONSTITUTION',
  };
  const held = verifyStrictChslFacet(facet, question, context);
  assert.ok(held.blockers.includes('PROVENANCE_NOT_RESOLVED'));
  const resolved = verifyStrictChslFacet(facet, question, { ...context, sourceRegistryKeys: new Set(['CONSTITUTION_INDIA']) });
  assert.equal(resolved.decision, 'promotable');
});

test('current events and atomic passages enforce their special evidence gates', () => {
  const current = fixture();
  current.facet.bucket_key = 'current_events';
  current.facet.section_key = 'general_awareness';
  const currentResult = verifyStrictChslFacet(current.facet, current.question, current.context);
  assert.ok(currentResult.blockers.includes('CURRENT_EVENT_DATE_MISSING'));
  assert.ok(currentResult.blockers.includes('CURRENT_EVENT_DATE_OUT_OF_WINDOW'));

  const passage = fixture();
  passage.facet.bucket_key = 'atomic_comprehension';
  passage.facet.section_key = 'english';
  const passageMetadata = passage.question.source_metadata as Record<string, unknown>;
  const passageOriginality = passageMetadata.originality as Record<string, unknown>;
  passageOriginality.template_generation = 'deterministic_rule_and_context_checked';
  passageOriginality.copied_passage = false;
  const passageResult = verifyStrictChslFacet(passage.facet, passage.question, passage.context);
  assert.ok(passageResult.blockers.includes('VERIFIED_ATOMIC_GROUP_REQUIRED'));

  passage.facet.group_id = 'group-1';
  passage.facet.group_order = 1;
  const verifiedPassage = verifyStrictChslFacet(passage.facet, passage.question, {
    ...passage.context,
    groupsById: new Map([['group-1', {
      id: 'group-1',
      group_type: 'cloze',
      passage: {
        en: 'A complete English cloze passage with enough text for strict automated validation.',
        hi: 'SSC English section ke liye yahi English passage learner ko dikhaya jayega.',
      },
      media: [],
      expected_item_count: 5,
      source_metadata: { content_owner: 'QuestionWale', structural_check: 'passed' },
      reviewer_status: 'verified',
      is_active: true,
    }]]),
  });
  assert.ok(!verifiedPassage.blockers.includes('VERIFIED_ATOMIC_GROUP_REQUIRED'));
  assert.ok(!verifiedPassage.blockers.includes('PROVENANCE_NOT_RESOLVED'));
});

test('promotion plan fills only each bucket deficit with deterministic diverse candidates', () => {
  const base = fixture();
  const results = Array.from({ length: 30 }, (_, index) => {
    const facet = { ...base.facet, id: `facet-${index}`, question_id: `question-${index}` };
    const question = {
      ...base.question,
      id: facet.question_id,
      correct_option: ['A', 'B', 'C', 'D'][index % 4],
      question_text: { en: `Unique deterministic question number ${index}`, hi: `विशिष्ट प्रश्न संख्या ${index}` },
    };
    const sourceMetadata = structuredClone(base.question.source_metadata) as Record<string, unknown>;
    sourceMetadata.question_key = `unique-question-key-${index}`;
    const rationales = sourceMetadata.option_rationales as Record<string, Record<string, unknown>>;
    for (const option of ['A', 'B', 'C', 'D']) rationales[option].is_correct = option === question.correct_option;
    question.source_metadata = sourceMetadata;
    const fingerprint = strictQuestionTextFingerprint(question.question_text, question.options);
    const key = strictQuestionKey(question.source_metadata);
    return verifyStrictChslFacet(facet, question, {
      ...base.context,
      mappedQuestionIds: new Set([question.id]),
      questionTextCounts: new Map([[fingerprint, 1]]),
      questionKeyCounts: new Map([[key, 1]]),
    });
  });
  const plan = buildStrictPromotionPlan(results, [{ section_key: 'reasoning', bucket_key: 'logic_inference', deficit: 20 }]);
  assert.equal(plan.selected.length, 20);
  assert.equal(new Set(plan.selected.map((item) => item.questionId)).size, 20);
  assert.equal(plan.unresolved, 0);
});
