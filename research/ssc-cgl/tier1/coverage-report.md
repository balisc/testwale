# SSC CGL Tier-I 2016–2025 corpus coverage

Verified on 2026-09-01. This repository does **not** contain a proven all-shift corpus, and this report does not claim that every shift was analysed.

## What is verified

- The official SSC CGL 2026 notice, paragraph 13.8, is the live simulation source: four ordered 25-question sections, 50 marks each, one hour with a 15-minute timer per subject, 80 minutes/20 minutes per subject for eligible-scribe candidates, bilingual questions except English Comprehension, and a 0.50-mark penalty for each wrong answer.
- SSC's official candidate and previous-paper pages were checked as first-party discovery points.
- SSC notices show that final answer-key/question-paper access can be time limited. A conduct or answer-key notice is not treated as a retained question corpus.
- AglaSem and Testbook were checked only as independent secondary date/shift archive indexes. Their advertised coverage was not promoted to verified corpus coverage.

## Coverage by cycle year

| Cycle | Expected shifts | Shift rows independently verified | Official paper/response-sheet rows retained | Secondary reconstructions classified | Excluded/ambiguous | Coverage |
|---:|---:|---:|---:|---:|---:|---:|
| 2016 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2017 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2018 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2019 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2020 | Unknown | 0 | 0 | 0 | Cycle/date reconciliation open | Not computable (0 classified) |
| 2021 | Unknown | 0 | 0 | 0 | Index-only | Not computable (0 classified) |
| 2022 | Unknown | 0 | 0 | 0 | Date bundles visible; completeness unproved | Not computable (0 classified) |
| 2023 | Unknown | 0 | 0 | 0 | Date bundles visible; completeness unproved | Not computable (0 classified) |
| 2024 | Unknown | 0 | 0 | 0 | Date bundles visible; completeness unproved | Not computable (0 classified) |
| 2025 | Unknown | 0 | 0 | 0 | One disrupted shift noted; final manifest open | Not computable (0 classified) |

Because the denominator is not independently verified, a numeric all-shift coverage percentage would be misleading. The actionable coverage value is **0 classified shifts**.

## Consequence for the blueprint

The checked-in blueprint is the prompt-supplied bootstrap prior, not a manifest-derived distribution. No means, medians, standard deviations, or occurrence rates are published because there are no classified shift rows. Every bucket therefore has very-low research confidence. Replacing it requires data/config changes to the versioned blueprint and facet rows, not a test-engine rewrite.

The read-only live inventory audit is recorded separately in `inventory-readiness-2026-09-01.csv`. Its `raw_taxonomy_quality_eligible` column is a pre-review candidate count, not a production launch count. `launch_verified_facets` remains zero until the additive migration is applied and content reviewers verify the generated facets and atomic groups.

## Sources and provenance policy

- Official 2026 notice: https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf
- Official candidate page: https://ssc.gov.in/for-candidates/cgl-exam/g21irqg6pmtxbag
- Official previous-paper page: https://ssc.gov.in/for-candidates/previous-year-question-paper
- Official 2025 conduct update: https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/CGLE_2025_Update_26092025.pdf
- Secondary index 1: https://docs.aglasem.com/org/ssc/ssc-cgl/question-paper
- Secondary index 2: https://testbook.com/ssc-cgl-exam/previous-year-papers

Aggregate classifications may be checked in later. Copyrighted paper text must not be bulk-copied, and a production question may be called a PYQ only after exact independent verification.
