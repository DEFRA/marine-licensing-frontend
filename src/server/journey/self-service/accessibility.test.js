// @vitest-environment jsdom
import { JSDOM } from 'jsdom'
import { vi } from 'vitest'
import { toHaveNoViolations } from 'vitest-axe/matchers'
import { runAxeChecks } from '#.vite/axe-helper.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import {
  setupTestServer,
  mockIatContext,
  mockOutcomeDocument
} from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('#src/services/iat-service/iat-context.service.js', () => ({
  iatContextService: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn()
  }
}))
vi.mock('#src/services/iat-service/iat-outcome-document.service.js', () => ({
  iatOutcomeDocumentService: {
    mint: vi.fn(),
    get: vi.fn()
  }
}))

const { iatContextService } =
  await import('#src/services/iat-service/iat-context.service.js')
const { iatOutcomeDocumentService } =
  await import('#src/services/iat-service/iat-outcome-document.service.js')

const TEST_SLUG = 'abcdefghijklmnopqrstuv'
const OUTCOME_DOC_SLUG = 'AZ4rr6bLclCVUsE2Pl_zKw'

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
    url: routes.OUTCOME_DOCUMENT.replace('{slug}', OUTCOME_DOC_SLUG),
    title: 'Marine licence requirement check'
  }
]

describe('IAT page accessibility (Axe)', () => {
  beforeAll(() => {
    config.set('selfService.enabled', true)
    expect.extend(toHaveNoViolations)
  })

  beforeEach(() => {
    mockIatContext(iatContextService, {
      slug: TEST_SLUG,
      questionLog: [
        {
          questionRoute: '/sea',
          questionText: 'Where will the activity take place?',
          answers: [{ id: 'inSea', text: 'In the sea' }],
          mcmsAppFormMapping: null
        },
        {
          questionRoute: '/jurisdiction',
          questionText: 'Which waters will the activity take place in?',
          answers: [{ id: 'englishWaters', text: 'English waters' }],
          mcmsAppFormMapping: null
        }
      ]
    })
    mockOutcomeDocument(iatOutcomeDocumentService, {
      slug: OUTCOME_DOC_SLUG,
      contextSlug: TEST_SLUG,
      capturedAt: new Date('2026-05-01T12:00:00Z').toISOString(),
      questionLog: [
        {
          questionRoute: '/sea',
          questionText: 'Where will the activity take place?',
          answers: [{ id: 'inSea', text: 'In the sea' }],
          mcmsAppFormMapping: null
        }
      ],
      outcomeRoute: '/mod-permission',
      outcomeKind: 'terminal-multi',
      outcomeHeading: 'MOD permission',
      outcomeText: '',
      focusedOption: {
        id: 'WO_STANDARD_TRACK_MLA',
        heading: 'Apply for a standard marine licence',
        text: '<p>You should apply for a standard track marine licence.</p>',
        module: null,
        link: null,
        overrideCtaButtonUrl: null,
        params: null
      }
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
