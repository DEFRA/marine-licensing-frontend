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

## Logging

- Don't write `event.category` from log calls. ECS defines it as a `keyword`
  array constrained to a fixed allowlist (`api`, `authentication`,
  `configuration`, `database`, `driver`, `email`, `file`, `host`, `iam`,
  `intrusion_detection`, `library`, `malware`, `network`, `package`,
  `process`, `registry`, `session`, `threat`, `vulnerability`, `web`).
  Use `event.action` for domain-specific markers, or prefix the `message`.
- Don't put unbounded user input into a process-global Set/Map keyed on
  request data — bound it (FIFO eviction is fine). The runtime `auth: false`
  routes are reachable without authentication.
