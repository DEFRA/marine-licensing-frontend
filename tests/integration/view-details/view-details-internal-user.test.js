import { testScenarios } from './fixtures.js'
import {
  validatePageStructure,
  validateAllSummaryCardsExist,
  validateApplicationDetails,
  validateProjectDetails,
  validateActivityDates,
  validateActivityDetails,
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

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('View Details - Content Verification Integration Tests', () => {
  const getServer = setupTestServer()

  const getPageDocument = async (exemption) => {
    mockExemption(exemption)
    jest.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
    const response = await makeGetRequest({
      server: getServer(),
      url: `${routes.VIEW_DETAILS_INTERNAL_USER}/${exemption.id}`,
      headers: {
        cookie: 'cookies_preferences_set=true'
      }
    })

    validateResponse(response, statusCodes.ok)
    return responseToDocument(response)
  }

  test('render content, but no back link', async () => {
    const { exemption, expectedPageContent } = testScenarios[0]
    const expectedContent = {
      ...expectedPageContent,
      pageCaption: exemption.applicationReference,
      backLinkText: null,
      projectDetails: {
        'Type of activity': 'Deposit of a substance or object',
        'Why this activity is exempt':
          "Based on the applicant's answers, their activity is exempt under Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)",
        "The applicant's answers from 'Check if you need a marine licence'": [
          'Download a copy of their answers (PDF)'
        ]
      },
      applicationDetails: {
        'Application type': 'Exempt activity notification',
        'Reference number': exemption.applicationReference,
        'Date submitted': format(exemption.submittedAt, 'd MMMM yyyy')
      }
    }
    const document = await getPageDocument(exemption)

    validatePageStructure(document, expectedContent)
    validateAllSummaryCardsExist(document, expectedContent)
    validateProjectDetails(document, expectedContent)
    validateApplicationDetails(document, expectedContent)
    validateActivityDates(document, expectedContent)
    validateActivityDetails(document, expectedContent)
    validateSiteDetails(document, expectedContent)
    validatePublicRegister(document, expectedContent)
    validateReadOnlyBehavior(document)
  })
})
