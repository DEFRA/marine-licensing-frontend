import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { testScenarios } from './marine-licence-fixtures/circular-site-fixtures.js'
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

describe('ML Review Site Details - Circular Coordinates Integration Tests', () => {
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
    '$name - validates circular coordinate display',
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
          validateCircularCoordinates(document, expectedPageContent, site)
          validateSiteDetailsCard(document, expectedPageContent, site)
          if (expectedPageContent.siteDetails[site].activityDetails?.length) {
            validateActivityDetailsCards(document, expectedPageContent, site)
          }
        }
      } else {
        validateCircularCoordinates(document, expectedPageContent, 0)
        validateSiteDetailsCard(document, expectedPageContent, 0)
        if (expectedPageContent.siteDetails[0].activityDetails?.length) {
          validateActivityDetailsCards(document, expectedPageContent, 0)
        }
      }
    }
  )

  describe('Edge Cases', () => {
    test('should handle empty circular coordinates gracefully', async () => {
      const emptyCircularMarineLicence = {
        id: 'test-ml-empty',
        projectName: 'Empty Circular Project',
        multipleSiteDetails: {},
        siteDetails: [
          {
            coordinatesType: 'coordinates',
            coordinatesEntry: 'single',
            coordinateSystem: 'wgs84',
            coordinates: null,
            circleWidth: null,
            siteName: ''
          }
        ]
      }

      const document = await getPageDocument(emptyCircularMarineLicence)
      const siteCard = getSiteDetailsCard(
        document,
        { siteDetails: [{ cardName: 'Site 1' }] },
        0
      )

      const methodRow = getRowByKey(
        siteCard,
        'Single or multiple sets of coordinates'
      )
      expect(methodRow).toBeTruthy()
      expect(methodRow.textContent).toContain(
        'Manually enter one set of coordinates and a width to create a circular site'
      )
    })
  })

  describe('back link', () => {
    test('should point to check your answers when from=check-your-answers', async () => {
      const response = await makeGetRequest({
        server: getServer(),
        url: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}?from=check-your-answers`
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      const document = new JSDOM(response.result).window.document

      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink.getAttribute('href')).toBe(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })
  })

  test('should redirect to task list when no marine licence id in cache', async () => {
    mockMarineLicence({})

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

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
        referer: `http://localhost${marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE}`
      }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validateCircularCoordinates = (document, expected, siteIndex) => {
    const siteCard = getSiteDetailsCard(document, expected, siteIndex)

    const centreRow = getRowByKey(siteCard, 'Coordinates at centre of site')
    expect(centreRow).toBeTruthy()
    expect(centreRow.textContent).toContain(
      expected.siteDetails[siteIndex].centreCoordinates
    )

    const widthRow = getRowByKey(siteCard, 'Width of circular site')
    expect(widthRow).toBeTruthy()
    expect(widthRow.textContent).toContain(
      expected.siteDetails[siteIndex].circleWidth
    )

    const mapViewRow = getRowByKey(siteCard, 'Map view')
    expect(mapViewRow).toBeTruthy()
    expect(mapViewRow.textContent.trim()).toBe('Map view')

    const mapDiv = mapViewRow.querySelector(
      '.app-site-details-map[data-module="site-details-map"]'
    )
    expect(mapDiv).toBeTruthy()
  }
})
