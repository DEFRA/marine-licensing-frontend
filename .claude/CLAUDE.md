# CLAUDE.md

## Code Standards

- Don't add code comments unless there's complex logic to explain.
- Read `.cursor/rules/javascript.mdc` before any non-trivial JS edit — it
  contains the full ruleset that SonarCloud enforces on PRs.

## Code Quality (enforced by SonarCloud — fix locally, don't ship and rely on PR feedback)

- **Always brace control-structure bodies.** Never `if (cond) return x` —
  always `if (cond) { return x }`. Same for `else`, `for`, `while`,
  `do-while`. (S121)
- **Keep functions small.** Cyclomatic ≤ 10, cognitive ≤ 15, length ≤ 75 lines.
  When a function grows past these, extract per-responsibility helpers
  rather than commenting or splitting later. (S3776, S1541, max-lines)
- **Don't nest control flow more than 3 deep.** Extract a helper when an
  `if`/`for`/`while` lands at depth 4+. (S134)
- **Don't reuse variable names across nested scopes.** A `const options` in
  an `if` block and another at the function level is a SonarCloud failure
  even though it's valid JS. Rename one or extract a helper. (S1117)
- **`if … else if` chains must end with `else`** (or be split into independent
  `if`s). (S126)
- **At most one `break`/`continue` per loop.** Refactor multiple `continue`s
  into early `return`s in extracted helpers. (S2208 family)

## Shared Project Helpers

### Site Details Anchor

- Use `getSiteDetailsAnchor(siteNumber)` from `#src/server/common/helpers/site-details/anchor-utils.js` when building links to a specific site card on the review-site-details page.
- `siteNumber` is **1-based** (the display number, not the array index). If you only have `siteIndex`, pass `siteIndex + 1`.
- Example: `` `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}` ``

## Logging (CDP ECS)

All application logging must follow CDP's streamlined Elastic Common Schema
(ECS). Logs that use non-standard fields may land in `broken_logs*` and will
not be searchable in OpenSearch as intended. Treat logs like cattle, not pets.

Enforced by ESLint rule `local/cdp-logging` (`eslint-rules/cdp-logging.js`).

### How to log

- Use `request.logger` in request handlers, or `createLogger()` from
  `#src/server/common/helpers/logging/logger.js` outside a request.
- Prefer Pino's structured form: `logger.info({ ...fields }, 'message')`.
- Pass errors as `err` so `@elastic/ecs-pino-format` maps them to `error.*`:
  `logger.error({ err: error }, 'Failed to delete exemption')`.
- Never use `console.log` / `console.error` for application logging (except
  unavoidable pre-logger startup failures).

### Field rules (from CDP logging docs)

- Only set fields marked ✅ or ✅⚠️ in the CDP schema. ❌ fields
  (`@timestamp`, `service.name`, `service.version`, `trace.id`,
  `container_*`, `ecs_*`, etc.) are reserved — values you set are overridden
  or dropped by the ingestion pipeline.
- Use **nested objects** for slash-path fields:
  `error/message` → `{ error: { message: '...' } }`,
  `event/action` → `{ event: { action: 'exemption_deleted' } }`.
  Flattened keys and nested maps are **not** the same in OpenSearch.
- Literal dotted flat keys (not nested): `host.hostname`, `log.level`,
  `span.id`, `transaction.id`.
- ✅⚠️ fields (`client.*`, `http.request.method`, `url.path`, etc.) are
  overridden when `req`/`res` are present — do not fight the pipeline.
- Put domain markers in `event.action` / `event.reason` / `event.reference`
  or in the `message` string. Do **not** invent custom top-level keys
  (e.g. `{ exemptionId }`) if the value must be findable in OpenSearch —
  use an allowed field such as `event.reference` or `tenant.message`.
- Don't write `event.category` unless it is one of the ECS allowlist values
  (`api`, `authentication`, `configuration`, `database`, `driver`, `email`,
  `file`, `host`, `iam`, `intrusion_detection`, `library`, `malware`,
  `network`, `package`, `process`, `registry`, `session`, `threat`,
  `vulnerability`, `web`). Prefer `event.action` for domain-specific markers.
- This schema is for application logs, not SC-controlled audit data.
- Redact secrets / PII; rely on configured log redact paths.

### Examples

```javascript
// ✅ GOOD
request.logger.error(
  {
    err: error,
    event: { action: 'exemption_delete_failed', reason: 'api_error' }
  },
  'Error deleting exemption'
)

request.logger.info(
  {
    event: { action: 'exemption_deleted', reference: exemptionId }
  },
  `Deleted exemption ${exemptionId}`
)

// ❌ BAD — custom fields not in CDP schema; console logging
request.logger.info({ exemptionId, foo: 'bar' }, 'deleted')
console.log('deleted', exemptionId)
logger.error(error) // pass { err: error } instead
```

## Other

- Don't put unbounded user input into a process-global Set/Map keyed on
  request data — bound it (FIFO eviction is fine). The runtime `auth: false`
  routes are reachable without authentication.
