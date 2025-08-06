import { axe, configureAxe } from 'jest-axe'
import { JSDOM } from 'jsdom'

export const configuredAxe = configureAxe({
  globalOptions: {
    checks: [{ id: 'wcag21a' }, { id: 'wcag21aa' }]
  }
})

export const runAxeChecks = async (response) => {
  const dom = new JSDOM(response)
  global.document = dom.window.document
  global.window = dom.window
  const results = await configuredAxe(dom.window.document.documentElement)
  expect(results).toHaveNoViolations()
}
