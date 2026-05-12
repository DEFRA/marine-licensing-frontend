import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { testScenarios } from './marine-licence-fixtures/polygon-fixtures.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import * as marineLicenceService from '~/src/services/marine-licence-service/index.js'
import {
  getRowByKey,
  getSiteDetailsCard,
  validateActivityDetailsCards,
  validateMultipleSites,
  validateNavigationElements,
  validatePageStructure,
  validateSiteDetailsCard,
  validateSiteLocationCard
} from './review-site-details-utils.js'

vi.mock('~/src/services/marine-licence-service/index.js')

describe('ML Review Site Details - Polygon Coordinates Integration Tests', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(testScenarios[0].marineLicence)
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(testScenarios[0].marineLicence)
    })
  })

  test.each(testScenarios)(
    '$name - validates polygon coordinate display',
    async ({ marineLicence, expectedPageContent }) => {
      const document = await getPageDocument(marineLicence)

      const isMultipleSites =
        marineLicence.multipleSiteDetails?.multipleSitesEnabled

      validatePageStructure(document, expectedPageContent)
      validateSiteLocationCard(document)
      validateNavigationElements(document)

      if (isMultipleSites) {
        validateMultipleSites(document, expectedPageContent)

        for (const site of expectedPageContent.siteDetails.keys()) {
          validatePolygonCoordinates(document, expectedPageContent, site)
          validateSiteDetailsCard(document, expectedPageContent, site)
          if (expectedPageContent.siteDetails[site].activityDetails?.length) {
            validateActivityDetailsCards(document, expectedPageContent, site)
          }
        }
      } else {
        validatePolygonCoordinates(document, expectedPageContent, 0)
        validateSiteDetailsCard(document, expectedPageContent, 0)
        if (expectedPageContent.siteDetails[0].activityDetails?.length) {
          validateActivityDetailsCards(document, expectedPageContent, 0)
        }
      }
    }
  )

  describe('Form Submission', () => {
    test('should redirect to task list on form submission', async () => {
      const response = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer(),
        formData: {}
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should redirect back to review page with anchor when addActivity is submitted', async () => {
      const scenarioWithActivities = testScenarios.find(
        (s) => s.marineLicence.siteDetails[0].activityDetails?.length
      )
      mockMarineLicence(scenarioWithActivities.marineLicence)

      const response = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        server: getServer(),
        formData: { addActivity: 'addActivity', siteNumber: '1' }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-2`
      )
    })
  })

  const getPageDocument = async (marineLicence) => {
    mockMarineLicence(marineLicence)
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    })

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      headers: {
        referer: `http://localhost${marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES}`
      }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validatePolygonCoordinates = (document, expected, siteIndex) => {
    const siteCard = getSiteDetailsCard(document, expected, siteIndex)

    for (const { label, value } of expected.siteDetails[siteIndex]
      .polygonCoordinates) {
      const row = getRowByKey(siteCard, label)
      expect(row).toBeTruthy()
      expect(row.textContent).toContain(value)
    }

    const mapViewRow = getRowByKey(siteCard, 'Map view')
    expect(mapViewRow).toBeTruthy()
    expect(mapViewRow.textContent.trim()).toBe('Map view')

    const mapDiv = mapViewRow.querySelector(
      '.app-site-details-map[data-module="site-details-map"]'
    )
    expect(mapDiv).toBeTruthy()
  }
})
