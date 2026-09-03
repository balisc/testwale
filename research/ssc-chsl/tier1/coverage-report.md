# SSC CHSL Tier-I 2016–2025 corpus coverage

Verified on 2026-09-01. This repository does **not** contain a proven all-shift corpus, and this report does not claim that every shift was analysed.

## Verified baseline and evidence boundary

- The official SSC CHSL 2025 notice is the live rules source: 25 questions and 50 marks in each of four parts, one global 60-minute paper (80 minutes for eligible scribe candidates), objective questions, and a 0.50-mark penalty per wrong answer.
- The SSC candidate and previous-paper pages were checked as first-party discovery points, but a discovery index is not a retained, hashed question corpus.
- SSC answer-key and response-sheet access is time-limited. No expired paper is promoted to covered merely because a notice or secondary index says it once existed.
- BYJU'S and PracticeMock were checked as lower-confidence topic/shift cross-checks. Their memory-based ranges are priors only; they are not classified as verified shifts here.

## Coverage by cycle year

| Cycle | Expected shifts | Covered shifts | Official retained | Secondary classified | Excluded/ambiguous | Coverage |
|---:|---:|---:|---:|---:|---:|---:|
| 2016 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2017 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2018 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2019 | Unknown | 0 | 0 | 0 | Cycle/date reconciliation open | Not computable (0 classified) |
| 2020 | Unknown | 0 | 0 | 0 | Cycle/date reconciliation open | Not computable (0 classified) |
| 2021 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2022 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2023 | Unknown | 0 | 0 | 0 | Sampled memory-based analyses only | Not computable (0 classified) |
| 2024 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2025 | Unknown | 0 | 0 | 0 | Official rules/conduct evidence, no retained paper corpus | Not computable (0 classified) |

The denominator is not independently verified, so a numeric all-shift percentage would be misleading. The actionable value is **0 classified shifts** across ten requested cycle years.

## Blueprint consequence

The checked-in distribution remains the prompt-supplied bootstrap prior. There are no manifest-derived means, medians, minima, maxima, standard deviations, or occurrence rates because `shift-topic-counts.csv` has no classified rows. Every bucket therefore has very-low research confidence. The transparent recency weights are retained for a later verified corpus: 45% for 2024–2025, 25% for 2022–2023, 20% for 2019–2021, and 10% for 2016–2018.

The engine and database store a versioned blueprint/rules snapshot, so replacing this distribution after corpus review is a configuration/data migration rather than a timer or test-engine rewrite.

## Live QuestionWale inventory preflight

The read-only 2026-09-01 audit resolved `SSC_CHSL` / `ssc-combined-higher-secondary-level-examination`, current published syllabus `SSC_CHSL_2025_OPERATIONAL_V1`, and 11,250 exact active verified Tier-I mappings. It found 2,300 Reasoning, 3,850 Mathematics, 1,750 English, and 3,350 General Awareness questions; `SUBJ_COMPUTER_KNOWLEDGE` was explicitly excluded. All 11,250 had A–D answers, English/Hindi question and option content, explanations, source metadata, and zero reports under the current schema checks.

These large taxonomy pools are not launch-ready facets. Current Events has 0/32 candidates with an explicit event date inside the 2024-01-01–2025-08-31 window, and English has 0/8 verified complete five-item passage groups. Every provisional facet still requires human review. Exact bucket counts are in `inventory-readiness-2026-09-01.csv`; launch remains blocked.

## Sources

- Official CHSL 2025 notice: https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf
- Official candidate page: https://ssc.gov.in/for-candidates/cgl-exam/s40d16nackd16h0
- Official previous-paper page: https://ssc.gov.in/for-candidates/previous-year-question-paper
- Secondary 2023 shift/topic analysis: https://byjus.com/ssc-exams/ssc-chsl-exam-analysis/
- Secondary topic-weightage cross-check: https://www.practicemock.com/blog/ssc-chsl-topic-wise-weightage/
- IIT Kanpur SATHEE cross-check (retrieval returned 403 during this audit): https://sathee.iitk.ac.in/sathee-ssc/ssc-exams/ssc-chsl/ssc-details/analysis-of-weightage-of-topics-based-on-previous-year-questions/

Only aggregate facts and classifications may be retained. Copyrighted paper text must not be bulk-copied, and a QuestionWale question may be labelled PYQ only after exact independent verification.
