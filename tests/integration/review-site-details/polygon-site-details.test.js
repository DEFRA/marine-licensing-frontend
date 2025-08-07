import { JSDOM } from 'jsdom'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { testScenarios } from './polygon-fixtures.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Review Site Details - Polygon Coordinates Integration Tests', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)
    jest
      .spyOn(cacheUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
    jest
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockImplementation(() => undefined)
  })

  test.each(testScenarios)(
    '$name - validates polygon coordinate display',
    async ({ exemption, expectedPageContent, coordinateSystem }) => {
      expect.hasAssertions()

      if (coordinateSystem) {
        jest
          .spyOn(cacheUtils, 'getCoordinateSystem')
          .mockReturnValue({ coordinateSystem })
      }

      const document = await getPageDocument(exemption)

      validatePageStructure(document, expectedPageContent)
      validateSiteDetailsCard(document, expectedPageContent)
      validatePolygonCoordinates(document, expectedPageContent)
      validateNavigationElements(document)
    }
  )

  describe('Edge Cases', () => {
    test('should handle empty polygon coordinates gracefully', async () => {
      const emptyPolygonExemption = {
        id: 'test-exemption-empty',
        projectName: 'Empty Polygon Project',
        siteDetails: {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: []
        }
      }

      const document = await getPageDocument(emptyPolygonExemption)
      const summaryCard = document.querySelector('.govuk-summary-card')
      expect(summaryCard).toBeTruthy()

      const methodRow = getRowByKey(
        summaryCard,
        'Method of providing site location'
      )
      expect(methodRow).toBeTruthy()
      expect(methodRow.textContent).toContain(
        'Manually enter multiple sets of coordinates'
      )
    })

    test('should filter out incomplete coordinates', async () => {
      const incompleteCoordinatesExemption = {
        id: 'test-exemption-incomplete',
        projectName: 'Incomplete Coordinates Project',
        siteDetails: {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '55.123456', longitude: '55.123456' },
            { latitude: '', longitude: '33.987654' },
            { latitude: '78.123456', longitude: '78.123456' },
            { latitude: null, longitude: null }
          ]
        }
      }

      const document = await getPageDocument(incompleteCoordinatesExemption)
      const summaryCard = document.querySelector('.govuk-summary-card')

      const startEndRow = getRowByKey(summaryCard, 'Start and end points')
      const point2Row = getRowByKey(summaryCard, 'Point 2')
      const point3Row = getRowByKey(summaryCard, 'Point 3')

      expect(startEndRow.textContent).toContain('55.123456, 55.123456')
      expect(point2Row.textContent).toContain('78.123456, 78.123456')
      expect(point3Row).toBeFalsy()
    })
  })

  describe('Form Submission', () => {
    test('should successfully submit polygon site details', async () => {
      const polygonExemption = testScenarios[0].exemption

      jest
        .spyOn(cacheUtils, 'getExemptionCache')
        .mockReturnValue(polygonExemption)
      jest.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
        payload: { id: polygonExemption.id }
      })

      const response = await server.inject({
        method: 'POST',
        url: routes.REVIEW_SITE_DETAILS
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(routes.TASK_LIST)
      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/site-details',
        expect.objectContaining({
          id: polygonExemption.id,
          siteDetails: expect.objectContaining({
            coordinatesType: 'coordinates',
            coordinatesEntry: 'multiple'
          })
        })
      )
    })
  })

  const getPageDocument = async (exemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: exemption.id } } }
    })

    const response = await server.inject({
      method: 'GET',
      url: routes.REVIEW_SITE_DETAILS,
      headers: {
        referer: `http://localhost${routes.ENTER_MULTIPLE_COORDINATES}`
      }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validatePageStructure = (document, expected) => {
    const heading = document.querySelector('h1')
    expect(heading.textContent.trim()).toBe('Review site details')

    const caption = document.querySelector('.govuk-caption-l')
    expect(caption.textContent.trim()).toBe(expected.projectName)

    const backLink = document.querySelector('.govuk-back-link')
    expect(backLink.textContent.trim()).toBe('Back')
    expect(backLink.getAttribute('href')).toBe(
      routes.ENTER_MULTIPLE_COORDINATES
    )
  }

  const validateSiteDetailsCard = (document, expected) => {
    const siteCard = document.querySelector('.govuk-summary-card')
    expect(siteCard).toBeTruthy()

    const cardTitle = siteCard.querySelector('.govuk-summary-card__title')
    expect(cardTitle.textContent.trim()).toBe('Site details')

    const methodRow = getRowByKey(siteCard, 'Method of providing site location')
    expect(methodRow.textContent).toContain(expected.siteDetails.method)

    const coordinateSystemRow = getRowByKey(siteCard, 'Coordinate system')
    expect(coordinateSystemRow.textContent).toContain(
      expected.siteDetails.coordinateSystem
    )
  }

  const validatePolygonCoordinates = (document, expected) => {
    const siteCard = document.querySelector('.govuk-summary-card')

    expected.siteDetails.polygonCoordinates.forEach((expectedCoordinate) => {
      const coordinateRow = getRowByKey(siteCard, expectedCoordinate.label)
      expect(coordinateRow).toBeTruthy()
      expect(coordinateRow.textContent).toContain(expectedCoordinate.value)
    })

    const mapViewRow = getRowByKey(siteCard, 'Map view')
    expect(mapViewRow).toBeFalsy()
  }

  const validateNavigationElements = (document) => {
    const saveButton = document.querySelector('button[type="submit"]')
    expect(saveButton.textContent.trim()).toBe('Save and continue')

    const cancelLink = document.querySelector('.govuk-link')
    expect(cancelLink.textContent.trim()).toBe('Cancel')
    expect(cancelLink.getAttribute('href')).toContain('/exemption/task-list')
  }

  const getRowByKey = (card, keyText) => {
    const rows = card.querySelectorAll('.govuk-summary-list__row')
    return Array.from(rows).find((row) => {
      const keyElement = row.querySelector('.govuk-summary-list__key')
      return keyElement && keyElement.textContent.trim() === keyText
    })
  }
})
