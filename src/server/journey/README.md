# journey/

Routes under `/journey/...` that walk the user through a guided
decision-tree experience.

## What lives here today

### Interactive Assistance Tool (IAT) — `self-service/`

The IAT is a decision tree that asks the user a series of questions
about their activity and tells them what kind of licence or permission
they need (if any). It is a lift-and-shift from the legacy Java
application in `mmo/iat/iat-source-code/`.

The IAT is **temporarily hosted inside `marine-licensing-frontend`**.
Once the port is complete and tested, it may move to its own
microservice and repository. Code inside `journey/self-service/` should be written in a way that
makes that later extraction cheap: stay loosely coupled to
`marine-licensing-frontend` internals, prefer plain Hapi/Nunjucks
patterns, and avoid reaching into unrelated feature directories.

### Pages

| URL                                            | Directory                | Ticket           |
| ---------------------------------------------- | ------------------------ | ---------------- |
| `/journey/self-service/start`                  | `self-service/start/`    | ML-1162          |
| `/journey/self-service/outcome/{outcomePath*}` | `self-service/outcome/`  | ML-1164          |
| `/journey/self-service/{questionPath*}`        | `self-service/question/` | ML-1186, ML-1269 |

More terminal outcome pages will land under `self-service/outcome/` as
follow-up tickets complete.

### Related tickets

- **ML-1157** — spike / parent for the IAT port
- **ML-1162** — IAT start page (this directory's first page)
- **ML-1186** — wires the "Start now" button behaviour on the start page
- Further tickets will add the question journey and outcome pages

## Conventions for files in this tree

### Layout chrome is suppressed

IAT pages deliberately render without the app's usual chrome:

- **No phase banner.**
- **No header navigation links.**

The template does not call `super()` so these are omitted as standard.

### Handler file layout

Each feature directory has one `controller.js` exporting both the GET
and POST handlers (e.g. `outcomeController` and
`outcomePostController`), matching the rest of
`marine-licensing-frontend`. Do not split handlers into a separate
`controller-post.js`.

When `controller.js` starts to feel unwieldy, extract pure helpers,
loaders, and view-model builders into a sibling `utils.js` (the
convention used elsewhere in the repo) rather than splitting
handlers across files. The JS cursor rule enforces function-level
size limits — cyclomatic ≤ 10, cognitive ≤ 15, length ≤ 75 lines —
not file-level ones, so a controller of any reasonable length is
fine as long as each handler stays within those bounds.

### Test file layout

For IAT pages we split the two test styles into separate files:

- **`controller.test.js`** — pure handler unit test. Asserts the
  controller calls `h.view` with the expected template path and view
  model. Does not boot a server.
- **`controller.integration.test.js`** — boots the real server via
  `setupTestServer` and makes an HTTP request via `makeGetRequest`,
  then asserts on the rendered HTML (parsed with JSDOM).
- **`index.test.js`** — asserts the Hapi plugin registers its route
  with the expected method, path, and options (`auth: false` for
  unauthenticated IAT pages).

This split differs from the rest of `marine-licensing-frontend`, as
integration tests are usually found in `tests/integration`. It is
intentional for the IAT because the tree will grow many pages sharing
the same testing patterns, and the per-file split keeps each concern
easy to find and extend.

### Accessibility (Axe) coverage

IAT a11y checks live in `self-service/accessibility.test.js` — an
IAT-scoped Axe sweep kept separate from the frontend-wide sweep at
`tests/integration/accessibility/page-accessibility.test.js` so that
a11y coverage travels with the module when it is extracted.

When a new IAT page or a new markup variant is added, add a
representative URL to that file's `pages` list. Pages with identical
markup (e.g. an outcome page with a different number of option cards)
do not need separate entries.

Repo-wide convention still applies: import only `vi` from `vitest`;
use `describe` / `test` / `expect` as globals.

### Route registration

Each IAT feature directory exports a Hapi plugin. Register it in
`src/server/router.js` alongside the other application plugins. The
routes are public: use `options: { auth: false }` on the route config.

### Where URLs live

Route paths are defined as constants in
`src/server/common/constants/routes.js` (e.g. `routes.IAT_START`).
Reference the constant in the plugin, not a bare string.
