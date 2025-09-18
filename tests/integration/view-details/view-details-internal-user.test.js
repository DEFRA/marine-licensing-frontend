import { testScenarios } from './fixtures.js'
import {
  validatePageStructure,
  validateAllSummaryCardsExist,
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

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('View Details - Content Verification Integration Tests', () => {
  const getServer = setupTestServer()

  const getPageDocument = async (exemption) => {
    mockExemption(exemption)
    jest.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
    const response = await getServer().inject({
      method: 'GET',
      url: `${routes.VIEW_DETAILS_INTERNAL_USER}/${exemption.id}`
    })

    validateResponse(response, statusCodes.ok)
    return responseToDocument(response)
  }

  test('render content, but no back link', async () => {
    const { exemption, expectedPageContent } = testScenarios[0]
    const expectedContent = { ...expectedPageContent, backLinkText: null }
    const document = await getPageDocument(exemption)

    validatePageStructure(document, expectedContent)
    validateAllSummaryCardsExist(document, expectedContent)
    validateProjectDetails(document, expectedContent)
    validateActivityDates(document, expectedContent)
    validateActivityDetails(document, expectedContent)
    validateSiteDetails(document, expectedContent)
    validatePublicRegister(document, expectedContent)
    validateReadOnlyBehavior(document)
  })
})
