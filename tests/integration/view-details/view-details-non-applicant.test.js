import { vi } from 'vitest'
import { testScenarios } from './fixtures.js'
import {
  validatePageStructure,
  validateAllSummaryCardsExist,
  validateApplicationDetails,
  validateProjectDetails,
  validateSiteDetails,
  validatePublicRegister
} from '../shared/summary-card-validators.js'
import { validateReadOnlyBehavior } from '../shared/dom-helpers.js'
import {
  mockExemption,
  responseToDocument,
  setupTestServer,
  validateResponse
} from '../shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { getAuthProvider } from '~/src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'
import { format } from 'date-fns'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('View Details (non-applicant ie internal user, or public)', () => {
  const getServer = setupTestServer()

  const getPageDocument = async (exemption, pageUrl) => {
    mockExemption(exemption)
    const response = await makeGetRequest({
      server: getServer(),
      url: pageUrl,
      headers: {
        cookie: 'cookies_preferences_set=true'
      }
    })

    validateResponse(response, statusCodes.ok)
    return responseToDocument(response)
  }

  const { exemption, expectedPageContent } = testScenarios[0]
  const savedExemption = { ...exemption, whoExemptionIsFor: 'Dredging Co' }
  const expectedContent = {
    ...expectedPageContent,
    summaryCards: [
      'Project summary',
      'Providing the site location',
      'Site details',
      'Sharing project information publicly'
    ],
    pageCaption: savedExemption.applicationReference,
    backLinkText: null,
    projectDetails: {
      'Type of activity': 'Deposit of a substance or object',
      'The purpose of the activity':
        'Scientific instruments and associated equipment',
      'Why this activity is exempt':
        "Based on the applicant's answers, their activity is exempt under Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)",
      "The applicant's answers from 'Check if you need a marine licence'": [
        'Download a copy of their answers (PDF)'
      ]
    },
    applicationDetails: {
      'Application type': 'Exempt activity notification',
      'Reference number': savedExemption.applicationReference,
      'Who the exemption is for': 'Dredging Co',
      'Date submitted': format(savedExemption.submittedAt, 'd MMMM yyyy')
    },
    publicRegister: {
      'Consent to publish project information': 'No',
      'Why the applicant did not consent': 'Legal reasons'
    }
  }

  test('internal user', async () => {
    vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
    const document = await getPageDocument(
      savedExemption,
      `${routes.VIEW_DETAILS_INTERNAL_USER}/${savedExemption.id}`
    )

    validatePageStructure(document, expectedContent)
    validateAllSummaryCardsExist(document, expectedContent)
    validateProjectDetails(document, expectedContent)
    validateApplicationDetails(document, expectedContent)
    validateSiteDetails(document, expectedContent)
    validatePublicRegister(document, expectedContent)
    validateReadOnlyBehavior(document)
  })

  test('public user', async () => {
    const document = await getPageDocument(
      savedExemption,
      `${routes.VIEW_DETAILS_PUBLIC}/${savedExemption.id}`
    )

    validatePageStructure(document, expectedContent)
    validateAllSummaryCardsExist(document, expectedContent)
    validateProjectDetails(document, expectedContent)
    validateApplicationDetails(document, expectedContent)
    validateSiteDetails(document, expectedContent)
    validatePublicRegister(document, expectedContent)
    validateReadOnlyBehavior(document)
  })
})
