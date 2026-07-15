# QuestionWale — Production Start Here

## One-time launch

1. In Supabase SQL Editor, run `scripts/QUESTIONWALE_PRODUCTION_FINAL_MIGRATION.sql`.
2. Confirm its final results:
   - `anon` and `authenticated`: answer/explanation access is `false`.
   - `service_role`: full access is `true`.
   - `totals_match` is `true`.
   - `inconsistent_question_relationships` is `0`.
3. Set every required variable shown in `.env.example` on the production host.
4. Run `npm ci` and `npm run verify`, then deploy.
5. Submit `https://questionwale.com/sitemap.xml` in Google Search Console.

## Routine content workflow

After launch, normal question uploads are enough. The database triggers update
subtopic, topic, subject and homepage totals after every INSERT/DELETE or relevant
question status/scope update. The web catalog refreshes within five minutes.

Every public question should have:

- matching `subject_id`, `topic_id` and `subtopic_id` hierarchy;
- bilingual `question_text` (`en`, `hi`);
- exactly four bilingual options (`A`, `B`, `C`, `D`);
- `correct_option` in `A`–`D`;
- bilingual `explanation`;
- valid `difficulty`;
- `is_active=true` and `is_verified=true` when ready to publish;
- verified citations in `source_metadata` for professional clickable-source UI.

Recommended `source_metadata` shape:

```json
{
  "primary_sources": [
    {
      "title": "Constitution of India — Legislative Department",
      "url": "https://legislative.gov.in/constitution-of-india/",
      "publisher": "Legislative Department, Government of India"
    }
  ],
  "secondary_sources": []
}
```

Question/practice routes intentionally remain `noindex` and answer-gated. Publish
original revision pages with visible official citations for indexable learning
content; do not hide links from users or show different content to Googlebot.

## Release command

```bash
npm run verify
```

This runs TypeScript, ESLint, source-parser tests and the production build.
