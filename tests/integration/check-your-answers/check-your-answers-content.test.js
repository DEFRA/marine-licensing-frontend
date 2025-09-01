import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
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
import { validateSubmissionSection } from '../shared/dom-helpers.js'
import {
  createTestServer,
  responseToDocument,
  validateResponse
} from '../shared/test-setup-helpers.js'

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Check your answers - page content Validation', () => {
  const testServer = createTestServer()
  let server

  beforeAll(async () => {
    server = await testServer.setup()
  })

  afterAll(async () => {
    await testServer.teardown()
  })

  beforeEach(() => {
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)
  })

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
      validateSubmissionSection(document, expectedPageContent)
    }
  )

  const getPageDocument = async (exemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: exemption.id } } }
    })

    const response = await server.inject({
      method: 'GET',
      url: routes.CHECK_YOUR_ANSWERS
    })

    validateResponse(response, statusCodes.ok)
    return responseToDocument(response)
  }
})
