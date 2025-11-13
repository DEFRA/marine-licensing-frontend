import { vi } from 'vitest'
import { testScenarios } from './fixtures.js'
import {
  validatePageStructure,
  validateAllSummaryCardsExist,
  validateProjectDetails,
  validateSiteLocation,
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
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('View Details - Content Verification Integration Tests', () => {
  const getServer = setupTestServer()

  const getPageDocument = async (exemption) => {
    mockExemption(exemption)
    const response = await makeGetRequest({
      server: getServer(),
      url: `${routes.VIEW_DETAILS}/${exemption.id}`,
      headers: {
        cookie: 'cookies_preferences_set=true'
      }
    })

    validateResponse(response, statusCodes.ok)
    return responseToDocument(response)
  }

  test.each(testScenarios)(
    '$name - validates every element on the page',
    async ({ exemption, expectedPageContent }) => {
      const document = await getPageDocument(exemption)

      validatePageStructure(document, expectedPageContent)
      validateAllSummaryCardsExist(document, expectedPageContent)
      validateProjectDetails(document, expectedPageContent)
      validateSiteLocation(document, expectedPageContent)
      validateActivityDetails(document, expectedPageContent)
      validateSiteDetails(document, expectedPageContent)
      validatePublicRegister(document, expectedPageContent)
      validateReadOnlyBehavior(document)
    }
  )
})
