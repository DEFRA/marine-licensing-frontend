import { configureAxe } from 'vitest-axe'

export const configuredAxe = configureAxe({
  globalOptions: {
    checks: [{ id: 'wcag21a' }, { id: 'wcag21aa' }]
  }
})

export async function runAxeChecks(container, options = {}) {
  const results = await configuredAxe(container, options)
  expect(results).toHaveNoViolations()
}
