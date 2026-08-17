import { vi } from 'vitest'
import { testScenarios } from './fixtures.js'
import {
  validatePageStructure,
  validateAllSummaryCardsExist,
  validateApplicationDetails,
  validateProjectDetails,
  validateSiteLocation,
  validateActivityDetails,
  validateSiteDetails,
  validatePublicRegister,
  validateAnySummaryCardsMissing
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
      validateAnySummaryCardsMissing(document, expectedPageContent)
      validateApplicationDetails(document, expectedPageContent)
      validateProjectDetails(document, expectedPageContent)
      validateSiteLocation(document, expectedPageContent)
      validateActivityDetails(document, expectedPageContent)
      validateSiteDetails(document, expectedPageContent)
      validatePublicRegister(document, expectedPageContent)
      validateReadOnlyBehavior(document)
    }
  )

  describe('application details card', () => {
    const { exemption, expectedPageContent } = testScenarios[0]

    test('shows the caption without the exempt activity notification suffix', async () => {
      const document = await getPageDocument(exemption)

      expect(document.querySelector('.govuk-caption-l')).toHaveTextContent(
        'EXE/2025/00003'
      )
      expect(document.querySelector('.govuk-caption-l')).not.toHaveTextContent(
        'Exempt activity notification'
      )
    })

    test('shows the date withdrawn row for a withdrawn exemption', async () => {
      const document = await getPageDocument({
        ...exemption,
        status: 'Withdrawn',
        withdrawnAt: '2025-07-19T09:00:00.000Z'
      })

      validateApplicationDetails(document, {
        ...expectedPageContent,
        applicationDetails: {
          ...expectedPageContent.applicationDetails,
          Status: 'Withdrawn',
          'Date withdrawn': '19 July 2025'
        },
        applicationDetailsMissingRows: []
      })
    })
  })
})
