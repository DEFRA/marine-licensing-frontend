// @vitest-environment jsdom
import { JSDOM } from 'jsdom'
import { toHaveNoViolations } from 'vitest-axe/matchers'
import { runAxeChecks } from '#.vite/axe-helper.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

describe('IAT page accessibility (Axe)', () => {
  beforeAll(() => {
    config.set('selfService.enabled', true)
    expect.extend(toHaveNoViolations)
  })

  const getServer = setupTestServer()

  const pages = [
    {
      url: '/journey/self-service/start',
      title: 'Check if you need a marine licence'
    },
    {
      url: '/journey/self-service/sea',
      title: 'Where will the activity take place?'
    },
    {
      url: '/journey/self-service/jurisdiction',
      title: 'Which waters will the activity take place in?'
    },
    {
      url: '/journey/self-service/outcome/construction/journey-select',
      title: 'Marine licence may be required'
    },
    {
      url: '/journey/self-service/construction/maintenance-existing-works',
      title:
        'Please select sub-activites that match with activities proposed to be carried out.'
    },
    {
      url: '/journey/self-service/outcome/exemption/licence-not-required-exemption-available-article-25A',
      title:
        'You need to provide more information, but you do not need a marine licence'
    },
    {
      url: '/journey/self-service/outcome/scaffolding-impede-navigation',
      title: 'Scaffolding or access towers - impede safe or normal navigation'
    }
  ]

  test.each(pages)(
    '"$title" page has no axe violations',
    async ({ title, url }) => {
      const response = await makeGetRequest({ url, server: getServer() })
      expect(response.statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(response.result).window
      expect(document.querySelector('title')).toHaveTextContent(
        `${title} - Get permission for marine work`
      )
      await runAxeChecks(document.documentElement)
    },
    10000
  )
})
