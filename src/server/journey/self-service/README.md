# Interactive Assistance Tool (IAT)

The Marine Licence Interactive Assistance Tool is a decision-tree
walkthrough that helps members of the public determine whether their
planned marine activity needs a marine licence. It is anonymous (no Defra
ID) and driven entirely by a JSON configuration file.

This README is the top-level entry point for IAT engineers. For the two
deeper-dive areas, see:

- [`data/README.data.md`](./data/README.data.md) — the `self-service.json`
  configuration model: question/outcome/outcomeType schema, the multiSelect
  rules, the five journey phases, HTML sanitisation expectations.
- [`services/README.data-quality.md`](./services/README.data-quality.md) —
  the load-time and runtime config-defect logger
  (`runLoadTimeScan` / `reportRuntimeIssue`), its ECS log shape, and the
  bounded `seenRuntimeIssues` set.

## File map

```
src/server/journey/self-service/
├── start/        # GET/POST /journey/self-service/start                   (ML-1162)
├── question/     # GET/POST /journey/self-service/{questionPath*}         (ML-1186)
├── outcome/      # GET/POST /journey/self-service/outcome/{...*}          (ML-1164)
│                 # GET      /journey/self-service/view-answers/{...}      (ML-1165)
├── answer/       # GET      /journey/self-service/answer/{slug}           (ML-1165)
├── data/         # self-service.json + load-time parser/sanitiser
└── services/     # journey-data, journey-router, data-quality,
                  # sanitise, session-answers, iat-answers-payload
```

All four route plugins are registered conditionally in
[`src/server/router.js`](../../router.js) when `selfService.enabled` is
true. They all run with `auth: false`.

## Routes

| Method | Path                                                                | Purpose                                                                                                                                 | Source      |
| ------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| GET    | `/journey/self-service/start`                                       | Pre-walkthrough landing page                                                                                                            | `start/`    |
| POST   | `/journey/self-service/start`                                       | Initialise session, redirect to first question                                                                                          | `start/`    |
| GET    | `/journey/self-service/{questionPath*}`                             | Render a question page (radio or multiSelect)                                                                                           | `question/` |
| POST   | `/journey/self-service/{questionPath*}`                             | Record answer(s) in session, redirect to the next node                                                                                  | `question/` |
| GET    | `/journey/self-service/outcome/{outcomePath*}`                      | Render an outcome (intermediate fork, terminal-single, or terminal-multi) with per-option "View answers" trigger links                  | `outcome/`  |
| POST   | `/journey/self-service/outcome/{outcomePath*}`                      | Branch an intermediate outcome via the selected `outcomeType`, redirect to its `nextQuestionRoute` (rejected for non-intermediate)      | `outcome/`  |
| GET    | `/journey/self-service/view-answers/{outcomeTypeId}/{outcomePath*}` | Mint an `iat-answers` doc keyed on the chosen outcomeType's text, 302 to `/journey/self-service/answer/{slug}` (per-option trigger URL) | `outcome/`  |
| GET    | `/journey/self-service/answer/{slug}`                               | Render the public, printable answer page for a previously completed walkthrough                                                         | `answer/`   |

The catch-all paths on question and outcome resolve through
`services/journey-data.js` and `services/journey-router.js`; see
[`data/README.data.md`](./data/README.data.md) for the routing rules.

## Request lifecycle

A typical walkthrough is three logical phases:

1. **Walk.** Browser GETs/POSTs through `start → question(s) → outcome(s)`.
   Answers accumulate in the Hapi session (`@hapi/yar`,
   `services/session-answers.js`). Each outcome page renders a per-option
   `View answers` link pointing at a trigger URL of the form
   `/journey/self-service/view-answers/<outcomeTypeId>/<outcomePath>` —
   one link per `outcomeType`, with no `iat-answers` doc persisted yet.
2. **Mint on click.** When the user clicks a `View answers` link the
   trigger GET runs `outcomeViewAnswersController` in
   `outcome/controller.js`: it validates the `outcomeTypeId` is one of
   the outcome's types, builds the `iat-answers` payload via
   `services/iat-answers-payload.js` (the chosen outcomeType's text
   becomes `summaryText`), POSTs it to the backend
   (`iatAnswersService.create` → `marine-licensing-backend POST
/iat-answers`), then 302s to `/journey/self-service/answer/<slug>`.
   This mirrors the Fivium app's per-option document model — each
   outcomeType the user clicks yields its own slug, so a user comparing
   options on a terminal-multi page can get distinct durable URLs per
   choice.
3. **View answers.** Anyone (the original walker or anyone they share the
   link with — including the public ArcGIS map layer that links to these
   URLs) can GET `/journey/self-service/answer/<slug>` to see the
   immutable record of the questions, answers, and outcome summary.

No `iat-answers` doc is persisted on a plain outcome-page GET. The
controller only writes when the user explicitly clicks `View answers`,
which keeps unused-doc accumulation proportional to actual reader intent
rather than to page-view volume.

## Append-only `iat-answers` contract

The frontend never mutates an existing `iat-answers` document. Re-walking
the IAT creates a _new_ document with a _new_ slug; the old slug remains
resolvable and unchanged. This is load-bearing: answer URLs are linked
from the public-record ArcGIS map layer and from emails, so they must be
durable. There is no PUT, PATCH, or DELETE on `/iat-answers/{slug}` and
the design will not add one.

| Backend route         | Method | Auth     | Purpose                           |
| --------------------- | ------ | -------- | --------------------------------- |
| `/iat-answers`        | POST   | optional | Insert new doc, return `{ slug }` |
| `/iat-answers/{slug}` | GET    | optional | Return doc body (`_id` stripped)  |

The slug is a 22-character base64url encoding of a UUIDv7 (RFC 9562):
48-bit timestamp prefix, 74 bits of random, 4 version bits, 2 variant
bits — 128 bits in the URL alphabet. See
[`marine-licensing-backend/src/iat-answers/api/helpers/generate-slug.js`](../../../../../marine-licensing-backend/src/iat-answers/api/helpers/generate-slug.js).

## Config flags

| Key                              | Env var                   | Default | Effect                                                                                                                                          |
| -------------------------------- | ------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `selfService.enabled`            | `ENABLE_SELF_SERVICE`     | `false` | Registers the four IAT route plugins and the data-quality init plugin. When false, all IAT URLs return 404.                                     |
| `selfService.dataQualityEnabled` | `ENABLE_IAT_DATA_QUALITY` | `false` | Runs `runLoadTimeScan` on Hapi `start` to log defects in `self-service.json`. Runtime defect logging in handlers is **not** gated by this flag. |

## Security: defence in depth

The IAT's threat model is unusual: the routes are public-by-design (no
Defra ID), and answer URLs are _intentionally_ shareable — they get linked
from the public ArcGIS map layer that already publishes exemption
locations, and will do the same for marine licences when those go live.
That makes some controls (auth, session-bound capability tokens) wrong
for the surface, and shifts the weight onto input validation, sanitisation,
and immutability of public-record artefacts.

The layers below are listed roughly outermost-first. Each row names what
it actually defends against — and, where useful, what it does _not_
defend against, so a reader doesn't infer protection that isn't there.

| #   | Defense                                                                      | Where                                                                                                                                                                                                                 | Defends against                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `selfService.enabled` feature flag                                           | [`src/server/router.js:51`](../../router.js)                                                                                                                                                                          | Accidental exposure of an incomplete IAT before launch (the four plugins are simply not registered when the flag is off)                                                                                                                            |
| 2   | Joi slug validation `Joi.string().length(22).pattern(/^[A-Za-z0-9_-]{22}$/)` | [`answer/index.js`](./answer/index.js), [`marine-licensing-backend/src/iat-answers/models/iat-answers.js`](../../../../../marine-licensing-backend/src/iat-answers/models/iat-answers.js)                             | Path traversal, NoSQL injection, and odd-charset trickery via the `{slug}` URL param. Joi rejects with 400 before the controller runs.                                                                                                              |
| 3   | 22-char base64url UUIDv7 slug as URL capability                              | [`marine-licensing-backend/src/iat-answers/api/helpers/generate-slug.js`](../../../../../marine-licensing-backend/src/iat-answers/api/helpers/generate-slug.js)                                                       | Guessing or enumerating answer URLs (74 bits of random plus a 48-bit timestamp the attacker would also need to hit, which together make brute force infeasible) and coupling the public URL space to MongoDB ObjectIds                              |
| 4   | Write-only API surface (no PUT/PATCH/DELETE on `/iat-answers/{slug}`)        | [`marine-licensing-backend/src/iat-answers/api/index.js`](../../../../../marine-licensing-backend/src/iat-answers/api/index.js)                                                                                       | Tampering with, or deletion of, public-record answer content by anyone who learns a slug. A re-walk creates a _new_ slug; the old URL is immutable. Unused docs will accumulate, which is accepted as we never will know which end up getting used. |
| 5   | Backend sanitisation of `outcome.summaryText` on insert                      | [`marine-licensing-backend/src/iat-answers/api/helpers/sanitise-summary-text.js`](../../../../../marine-licensing-backend/src/iat-answers/api/helpers/sanitise-summary-text.js)                                       | Stored XSS via the only HTML-bearing field the frontend POSTs. Uses `sanitize-html` with a tag/scheme allowlist that is **byte-identical** to the frontend's `richTextSanitiseOptions` (see the contract comment in `sanitise-summary-text.js`)     |
| 6   | Frontend sanitisation of `self-service.json` content at load time            | [`services/sanitise.js`](./services/sanitise.js), applied by `services/journey-data.js` to `question.hint`, `answer.hint`, `outcome.text`, `outcomeType.text`, with `stripHtml` on `question.text` and `section.text` | Reflected XSS from configuration content rendered into the IAT pages. Same allowlist as backend `sanitiseSummaryText` plus the `govuk-hint` class transform for hint paragraphs                                                                     |
| 7   | Frontend re-sanitisation of `summaryText` on the answer page                 | [`answer/index.njk:28`](./answer/index.njk) (`\| sanitiseRichText`)                                                                                                                                                   | Stored XSS in the (very unlikely) case that a malicious actor wrote a document directly into Mongo, bypassing layer 5. Defence in depth — the same allowlist is applied at both write and render.                                                   |
| 8   | No PII in the `iat-answers` document body                                    | [`services/iat-answers-payload.js`](./services/iat-answers-payload.js) — payload is `{ outcome: { route, typeId, summaryText }, answers: [{ questionRoute, questionText, answers: [{ id, text }] }] }` only           | Accidental publication of personal data when the answer URL is shared or indexed. The doc carries only the user's question/answer trail and the rendered outcome text — no name, email, phone, IP, or session ID                                    |
| 9   | Bounded `seenRuntimeIssues` Set (FIFO, 100 entries)                          | [`services/data-quality.js`](./services/data-quality.js), see [`services/README.data-quality.md`](./services/README.data-quality.md)                                                                                  | Process-level memory growth from anonymous traffic that hits a malformed-config branch. Required because the runtime callers are reachable on `auth: false` routes.                                                                                 |

Things this list deliberately does _not_ claim:

- The IAT does **not** carry CSRF protection on its POST endpoints. The
  routes are `auth: false`, there is no per-user session token (the
  walkthrough is identified only by the Hapi session cookie), and there
  is no persistent state to forge a write against beyond a single
  session. If a future change adds a per-user-bound write, CSRF will
  need to be revisited.
- The IAT does **not** apply application-layer rate limiting. CDP's
  nginx and WAF layers provide platform-level throttling.
- Answer URLs do **not** expire and are **not** unlisted. This is a
  product decision: they are intended to be linkable from public
  records.

## Tests

- Unit/component: colocated `*.test.js` next to each module.
- Integration: `controller.integration.test.js` files in `start/`,
  `question/`, `outcome/`, `answer/` — exercise the full Hapi handler
  with `setupTestServer`.
- Accessibility (Axe): every public IAT page variant is covered in
  [`accessibility.test.js`](./accessibility.test.js):
  - start
  - radio-button question (sea, jurisdiction)
  - multiSelect question (maintenance-existing-works)
  - intermediate outcome / fork (journey-select)
  - terminal-single outcome (article 25A)
  - terminal-multi outcome (scaffolding-impede-navigation)
  - answer page (ML-1165, with `iatAnswersService.get` stubbed)
- Contract: the `sanitise-summary-text` allowlist contract between
  frontend and backend is checked by canary tests in both repos. The
  load-bearing comment lives in
  [`marine-licensing-backend/src/iat-answers/api/helpers/sanitise-summary-text.js`](../../../../../marine-licensing-backend/src/iat-answers/api/helpers/sanitise-summary-text.js).
