import * as exemptionServiceModule from '~/src/services/exemption-service/index.js'
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
  createTestServer,
  responseToDocument,
  validateResponse
} from '../shared/test-setup-helpers.js'

jest.mock('~/src/services/exemption-service/index.js')

describe('View Details - Content Verification Integration Tests', () => {
  const testServer = createTestServer()
  let server

  beforeAll(async () => {
    server = await testServer.setup()
  })

  afterAll(async () => {
    await testServer.teardown()
  })

  const getPageDocument = async (exemption) => {
    const mockExemptionService = {
      getExemptionById: jest.fn().mockResolvedValue(exemption)
    }
    jest
      .mocked(exemptionServiceModule.getExemptionService)
      .mockReturnValue(mockExemptionService)

    const response = await server.inject({
      method: 'GET',
      url: `/exemption/view-details/${exemption.id}`
    })

    validateResponse(response, 200)
    return responseToDocument(response)
  }

  test.each(testScenarios)(
    '$name - validates every element on the page',
    async ({ exemption, expectedPageContent }) => {
      expect.hasAssertions()

      const document = await getPageDocument(exemption)

      validatePageStructure(document, expectedPageContent)
      validateAllSummaryCardsExist(document, expectedPageContent)
      validateProjectDetails(document, expectedPageContent)
      validateActivityDates(document, expectedPageContent)
      validateActivityDetails(document, expectedPageContent)
      validateSiteDetails(document, expectedPageContent)
      validatePublicRegister(document, expectedPageContent)
      validateReadOnlyBehavior(document)
    }
  )
})
