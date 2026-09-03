# SSC CHSL logged-in ecosystem runbook

The authenticated SSC CHSL experience uses two exact preparation stages:

- `TIER_I` → `/ssc-chsl/tier-1/subjects`
- `TIER_II` → `/ssc-chsl/tier-2/subjects`

Both routes continue through canonical Subject → Topic → Subtopic → Questions
paths. Question reads are always scoped by the exact `SSC_CHSL` exam profile,
the selected stage code, and the canonical content subtopic ID.

## Database rollout

Run the SQL files in this order:

1. `scripts/publish_ssc_chsl_for_learners.sql`
2. `scripts/migrate_generic_exam_preparation_preferences.sql`
3. `scripts/verify_ssc_chsl_ecosystem.sql`

The publish migration is safe to rerun. In addition to the existing 5/38/251
published-hierarchy checks, it creates deterministic syllabus-node stage
mappings:

- Tier 1 receives the four non-qualifying subject trees.
- Tier 2 receives the complete objective hierarchy and the qualifying
  Computer Knowledge and Skill/Typing Test scope.

The generic preference migration must follow it because preparation-track
availability is derived from those exact node mappings and the verified
question `stage_codes`. It also enables durable non-CGL stage preferences.

## Application verification

Run:

```powershell
npm.cmd run test:ssc-chsl
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Manual smoke checks:

- A guest opening `/ssc-chsl` or a deep private CHSL route lands on the public
  SSC CHSL syllabus.
- A signed-in learner can select Tier 1 or Tier 2 and is taken to the saved
  stage's subjects.
- `?change=1` on `/ssc-chsl` permits changing the saved tier.
- Subject, topic, subtopic, question, pagination, answer submission, and
  progress restoration remain inside the exact CHSL profile and stage.
- Dashboard and search results point to `/ssc-chsl/...`, not the generic
  `/subjects/...` flow.
- Profile/onboarding shows the saved stage and can change it through the generic
  exam preference flow.
