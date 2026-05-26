// @vitest-environment jsdom
import { JSDOM } from 'jsdom'
import { vi } from 'vitest'
import { toHaveNoViolations } from 'vitest-axe/matchers'
import { runAxeChecks } from '#.vite/axe-helper.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import {
  setupTestServer,
  mockIatAnswers
} from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'

vi.mock('#src/services/iat-answers-service/iat-answers.service.js', () => ({
  iatAnswersService: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    publish: vi.fn()
  }
}))

const { iatAnswersService } =
  await import('#src/services/iat-answers-service/iat-answers.service.js')

const TEST_SLUG = 'abcdefghijklmnopqrstuv'

const slugUrl = (path) =>
  `/journey/self-service/c/${TEST_SLUG}${path.startsWith('/') ? path : `/${path}`}`

const pages = [
  {
    url: '/journey/self-service/start',
    title: 'Check if you need a marine licence'
  },
  {
    url: slugUrl('/sea'),
    title: 'Where will the activity take place?'
  },
  {
    url: slugUrl('/jurisdiction'),
    title: 'Which waters will the activity take place in?'
  },
  {
    url: slugUrl('/outcome/construction/journey-select'),
    title: 'Marine licence may be required'
  },
  {
    url: slugUrl('/construction/maintenance-existing-works'),
    title:
      'Please select sub-activites that match with activities proposed to be carried out.'
  },
  {
    url: slugUrl(
      '/outcome/exemption/licence-not-required-exemption-available-article-25A'
    ),
    title:
      'You need to provide more information, but you do not need a marine licence'
  },
  {
    url: slugUrl('/outcome/scaffolding-impede-navigation'),
    title: 'Scaffolding or access towers - impede safe or normal navigation'
  },
  {
    url: `/iat-answer/${TEST_SLUG}`,
    title: 'Marine licence requirement check'
  }
]

describe('IAT page accessibility (Axe)', () => {
  beforeAll(() => {
    config.set('selfService.enabled', true)
    expect.extend(toHaveNoViolations)
  })

  beforeEach(() => {
    mockIatAnswers(iatAnswersService, {
      slug: TEST_SLUG,
      answers: [
        { type: 'question', questionRoute: '/sea', answerIds: ['inSea'] },
        {
          type: 'question',
          questionRoute: '/jurisdiction',
          answerIds: ['englishWaters']
        }
      ]
    })
  })

  const getServer = setupTestServer()

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
