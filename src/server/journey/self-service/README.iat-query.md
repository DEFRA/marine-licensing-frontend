# IAT query CLI (`npm run iat`)

A read-only developer CLI for inspecting the IAT journey defined in
[`data/self-service.json`](./data/self-service.json). The file is large
(~5000 lines) and relational — questions point at answers, answers route to
other questions or outcomes, outcomes fan out into outcomeTypes, and
outcomeTypes can route forward again. Hand-grepping or `jq`-ing it is
error-prone, and it does not show you where a node actually leads at
runtime.

The CLI reuses the **same parsed/sanitised view the running app sees**
([`services/journey-data.js`](./services/journey-data.js)) and the **real
router** ([`services/journey-router.js`](./services/journey-router.js),
`calculateNextRoute`). So "where does this answer go?" is computed exactly
the way the live handler computes it — what you see matches what runs.

This README is the home for the CLI. It is linked from the
[top-level IAT README](./README.md). For the routing _rules_ the CLI
surfaces (single-select, multi-select, outcome forks), see
[`data/README.data.md`](./data/README.data.md).

## Running

```bash
npm run iat                              # prints usage (exit 2)
npm run iat -- <subcommand> [args] [--json]
```

- Always use the `npm run iat -- …` form (the `--` passes args through the
  npm script). The bare `npm run iat` prints the usage banner.
- Every subcommand accepts `--json` for machine-readable output.
- **Exit codes:** `0` success · `1` not-found / unreachable · `2` invalid
  args, unknown subcommand, or no subcommand. These make the CLI scriptable
  — e.g. `npm run iat -- reach /some-page` returns `1` if a page is
  orphaned.

## Two command families

### 1. Inspect / list a node

Questions, outcomes and outcomeTypes by id or filter.

| Subcommand                                                             | Purpose                                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `question <route>`                                                     | One question: its answers and the runtime target of each answer                             |
| `outcome <route>`                                                      | One outcome: heading, classification, and inline outcomeTypes                               |
| `outcome-type <id>`                                                    | One outcomeType: params, link, module, nextQuestionRoute, CTA overrides                     |
| `outcomes [--classify X] [--has-param N[=V]] [--has-link]`             | List outcomes; filter by `intermediate` / `terminal-single` / `terminal-multi`, param, link |
| `outcome-types [--has-param N[=V]] [--has-next-question] [--has-link]` | List outcomeTypes; find ones that route forward or carry a downloadable asset               |
| `questions [--mapping N] [--has-mapping]`                              | List questions; filter by `mcmsAppFormMapping`                                              |
| `mappings`                                                             | Distinct `mcmsAppFormMapping` values + the question route(s) carrying each                  |

`--classify` accepts `intermediate`, `terminal-single`, or `terminal-multi`
(the same buckets `classifyOutcome` produces). `--has-param N` matches an
outcomeType param by name; `--has-param N=V` also pins its value.
`--has-link` (added on this branch) filters to nodes whose outcomeType
carries a `link` — handy for finding the outcomes that surface a
downloadable `.docx` template.

### 2. Traverse the journey graph

The journey is a directed graph. These commands (added on this branch via
[`iat-graph-commands.js`](../../../../scripts/iat-graph-commands.js) +
[`journey-graph.js`](../../../../scripts/journey-graph.js)) answer "how do I
get to / out of a page?".

| Subcommand             | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `path [<from>] <to>`   | One shortest click-by-click journey. `from` defaults to the first question |
| `reach <route>`        | Is `<route>` reachable from the start? Exit `0` reachable, `1` not         |
| `predecessors <route>` | Which pages route **directly into** this node, and via which choice        |

`path <to>` starts from the first question (`/sea`); `path <from> <to>`
starts from an explicit route. `reach` is the boolean form of `path` and is
designed for scripting on its exit code. `predecessors` is the reverse
lookup — it scans every node's outgoing edges for ones that land on
`<route>`.

## The graph model

Three node types and four ways of routing between them. The model lives in
[`journey-graph.js`](../../../../scripts/journey-graph.js); each edge is
derived by asking the **real router** where a choice leads, so the graph can
never drift from runtime behaviour.

| Node                     | Outgoing edges                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Question (single-select) | One edge per answer, labelled `answer "<text>"`, to the answer's resolved next route                                                                                        |
| Question (multi-select)  | Exactly **two** edges: `tick any activity except "<outcomeAnswerId>"` (continue via `questionRoute`) and `tick "<outcomeAnswerId>"` (go to the multi-select `outcomeRoute`) |
| Outcome (intermediate)   | One edge per outcomeType that has a `nextQuestionRoute`, labelled `continue: "<heading>"`                                                                                   |
| Outcome (terminal)       | None — terminal-single / terminal-multi outcomes are sinks                                                                                                                  |

`shortestPath` is a breadth-first search from `from`, so the first path it
finds is a shortest one (fewest clicks). It is **a** shortest path, not the
only one — multi-select bridges and outcome forks mean several equal-length
routes can exist. `reach` is `shortestPath(...) !== null`. `predecessors`
walks every question + outcome node and collects the ones whose edges target
the requested route.

## Worked examples

```bash
# How does a user actually reach the MOD-permission outcome?
npm run iat -- path /mod-permission
```

```
- /sea → In or over the sea
- /jurisdiction → English waters or Northern Ireland offshore waters
- /activity-type → Dredging
- /exemption/dredging → Something else
- /exemption/dredging-exe-not-available-continue → Continue
- /dredging/activity → Non-navigational clearance dredging
- /dredging/activities → tick any activity except OTHER_CLEARANCE_DREDGING
- /activity/completion → Yes
- /public-register → No
- /part-of-larger-project → No
- /single-location → Yes
- /military-defence-area → Yes
- /ministry-of-defence → No
- /ministry-of-defence/permission → No → /mod-permission
```

Each line is one click: `- <from> → <choice you make there>`. The final
line appends ` → <destination>`. Note the mix of single-select answers
(`In or over the sea`), an intermediate-outcome fork (`Continue`), and a
multi-select tick branch (`tick any activity except …`) — all three routing
mechanisms appear in one journey.

```bash
# Which pages lead straight into /military-defence-area?
npm run iat -- predecessors /military-defence-area
```

```
/single-location	answer "Yes"
/multiple-locations	answer "Yes"
```

```bash
# Is a page reachable at all? (scriptable on exit code)
npm run iat -- reach /mod-permission        # → "reachable: /mod-permission", exit 0

# A terminal-single outcome whose ADV_TYPE is EXE — handy when writing a test
npm run iat -- outcomes --classify terminal-single --has-param ADV_TYPE=EXE

# Every outcome that surfaces a downloadable asset (e.g. .docx templates)
npm run iat -- outcomes --has-link

# Resolve the link-bearing outcomeTypes to their actual asset URLs
npm run iat -- outcome-types --has-link --json

# Every mcmsAppFormMapping in the JSON, with the question carrying it
npm run iat -- mappings

# A specific question and where each answer branches to
npm run iat -- question /activity-type
```

## `--json` output

`--json` is supported on every subcommand. Shapes worth knowing:

- `path --json` → `{ from, to, found, steps: [{ from, fromText, label, to, kind }] }`.
  `found` is `false` (and exit `1`) when there is no path.
- `reach --json` → `{ route, reachable }`.
- `predecessors --json` → `[{ route, via }]`.

The inspect/list commands emit the same fields as their human output as
JSON objects/arrays. `--json` does not change exit codes.

## Source files

The tool was split out of a single script on this branch to keep each file
under the SonarCloud file-length limit and to separate concerns:

| File                                                                         | Responsibility                                                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`scripts/iat-query.js`](../../../../scripts/iat-query.js)                   | Subcommand dispatch + the node inspect/list commands; the entry point                          |
| [`scripts/iat-graph-commands.js`](../../../../scripts/iat-graph-commands.js) | The `path` / `reach` / `predecessors` command handlers + formatting                            |
| [`scripts/journey-graph.js`](../../../../scripts/journey-graph.js)           | The graph model: `edgesFrom`, `shortestPath`, `reach`, `predecessors`                          |
| [`scripts/iat-utils.js`](../../../../scripts/iat-utils.js)                   | Shared arg-parsing and formatting helpers (`excerpt`, `dash`, `runSingleArg`, `jsonResult`, …) |

Tests are colocated:
[`scripts/iat-query.test.js`](../../../../scripts/iat-query.test.js) (command
surface, exit codes, `--json`) and
[`scripts/journey-graph.test.js`](../../../../scripts/journey-graph.test.js)
(edge model + traversal).

> The CLI lives in `scripts/` — outside the `self-service/` tree it
> inspects — so it imports `journey-data.js` / `journey-router.js` across the
> tree boundary. If the IAT is later extracted to its own service, these
> scripts move with it (they have no dependency on anything outside
> `self-service/`).
