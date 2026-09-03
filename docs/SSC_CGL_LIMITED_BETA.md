# SSC CGL Tier 1 limited beta

The exact `ssc-cgl-tier1-2026-v1` blueprint remains provisional and must not be
marked production-ready until all 39 exact inventory buckets pass their review
and corpus gates.

The separate `ssc-cgl-tier1-2026-limited-v1` blueprint provides a usable,
explicitly labelled beta from the currently available base-verified corpus. It
preserves:

- four ordered 25-question sections;
- 100 unique frozen questions and 200 marks;
- +2/-0.5 scoring;
- server-authoritative 15-minute sectional timing (20 minutes for the eligible
  scribe simulation);
- one complete five-question English reading-comprehension family;
- bilingual content outside the English section.

It does not claim the exact topic distribution. The UI names the excluded or
redistributed families, and generated tests persist `limited_mode=true` plus a
relaxation audit entry.

## Prepare and verify

Dry-run first:

```powershell
npm.cmd run prepare:ssc-cgl-mock-limited
```

After reviewing the generated report:

```powershell
npm.cmd run prepare:ssc-cgl-mock-limited -- --apply --confirm=ssc-cgl-tier1-2026-limited-v1
```

The apply is idempotent. It creates or refreshes the separate limited blueprint,
copies only eligible exact-blueprint facets without promoting ordinary facets,
normalizes four existing five-question passage families, validates 250 seeded
selections before and after the write, deactivates the exact blueprint, and
activates the limited blueprint. If post-activation validation fails, it
restores the previous active-blueprint state.

Enable the application path with:

```text
QW_SSC_CGL_MOCKS_ENABLED=true
QW_SSC_CGL_MOCKS_LIMITED_MODE=true
```

Setting limited mode back to `false` makes the application resolve the exact
blueprint again; it will stay blocked until that blueprint is reactivated and
all production launch gates pass.
