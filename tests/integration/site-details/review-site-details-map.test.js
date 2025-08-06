import { getByRole, getByText, queryByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Review Site Details - Map Integration Tests', () => {
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
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })

    jest.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({
      payload: {
        id: mockExemption.id,
        siteDetails: mockExemption.siteDetails
      }
    })
  })

  const createMockExemption = (siteDetailsOverride = {}) => ({
    ...mockExemption,
    siteDetails: {
      ...mockExemption.siteDetails,
      ...siteDetailsOverride
    }
  })

  const getPageDocument = async (exemption = mockExemption) => {
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)

    // Override coordinate system mock if exemption has specific coordinateSystem
    if (exemption.siteDetails?.coordinateSystem) {
      jest.spyOn(cacheUtils, 'getCoordinateSystem').mockReturnValue({
        coordinateSystem: exemption.siteDetails.coordinateSystem
      })
    }

    // Ensure authenticated request returns the exemption with its site details
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: exemption }
    })

    const response = await server.inject({
      method: 'GET',
      url: routes.REVIEW_SITE_DETAILS,
      headers: {
        referer: `http://localhost/${routes.WIDTH_OF_SITE}`
      },
      auth: {
        strategy: 'session',
        credentials: {
          userId: 'test-user-id',
          sessionId: 'test-session-id'
        }
      }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    return new JSDOM(response.result).window.document
  }

  const validateMapContainer = (document) => {
    const mapContainer = document.querySelector('.app-site-details-map')
    expect(mapContainer).toBeInTheDocument()
    expect(mapContainer.getAttribute('data-module')).toBe('site-details-map')
  }

  const validateSiteDetailsData = (document, expectedData) => {
    const dataScript = document.querySelector('#site-details-data')
    expect(dataScript).toBeInTheDocument()

    const siteData = JSON.parse(dataScript.textContent)
    Object.entries(expectedData).forEach(([key, value]) => {
      expect(siteData[key]).toEqual(value)
    })
  }

  const validateSummaryContent = (document, key, expectedValue) => {
    const rows = document.querySelectorAll('.govuk-summary-list__row')
    const row = Array.from(rows).find((row) => {
      const keyElement = row.querySelector('.govuk-summary-list__key')
      return keyElement?.textContent.trim() === key
    })
    expect(row).toBeTruthy()

    const valueElement = row.querySelector('.govuk-summary-list__value')
    expect(valueElement.textContent.trim()).toBe(expectedValue)
  }

  describe('Manual Coordinates with Circle', () => {
    test('should display map for manual coordinates with circle width', async () => {
      const document = await getPageDocument()

      validateMapContainer(document)

      const mapViewRow = queryByText(document, 'Map view')
      expect(mapViewRow).toBeInTheDocument()
    })

    test('should display map for manual coordinates without circle width', async () => {
      expect.hasAssertions()
      const siteDetailsOverride = {
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
        coordinates: { eastings: '123456', northings: '654321' },
        circleWidth: null
      }

      const document = await getPageDocument(
        createMockExemption(siteDetailsOverride)
      )

      validateMapContainer(document)
      validateSiteDetailsData(document, {
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
        coordinates: { eastings: '123456', northings: '654321' },
        circleWidth: null
      })

      validateSummaryContent(
        document,
        'Coordinate system',
        'OSGB36 (National Grid)Eastings and Northings'
      )
      validateSummaryContent(
        document,
        'Coordinates at centre of site',
        '123456, 654321'
      )
    })
  })

  describe('File Upload Coordinates', () => {
    const getFileUploadTestData = (fileUploadType, filename) => ({
      coordinatesType: 'file',
      fileUploadType,
      uploadedFile: { filename },
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-1.234567, 50.123456]
            }
          }
        ]
      }
    })

    test.each([
      ['Shapefile', 'shapefile', 'test-site.zip'],
      ['KML file', 'kml', 'test-site.kml']
    ])(
      'should display map for %s upload',
      async (displayName, fileUploadType, filename) => {
        expect.hasAssertions()
        const siteDetailsOverride = getFileUploadTestData(
          fileUploadType,
          filename
        )

        const document = await getPageDocument(
          createMockExemption(siteDetailsOverride)
        )

        validateMapContainer(document)
        validateSiteDetailsData(document, {
          coordinatesType: 'file',
          fileUploadType,
          geoJSON: siteDetailsOverride.geoJSON
        })

        validateSummaryContent(
          document,
          'Method of providing site location',
          'Upload a file with the coordinates of the site'
        )
      }
    )
  })

  describe('Page Structure and Navigation', () => {
    test('should display correct page structure and navigation elements', async () => {
      const siteDetailsOverride = {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: { latitude: '50.123456', longitude: '-1.234567' },
        circleWidth: '100'
      }

      const document = await getPageDocument(
        createMockExemption(siteDetailsOverride)
      )

      const heading = getByRole(document, 'heading', { level: 1 })
      expect(heading).toHaveTextContent('Review site details')

      const projectName = getByText(document, mockExemption.projectName)
      expect(projectName).toBeInTheDocument()

      const backLink = document.querySelector('.govuk-back-link')
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveTextContent('Back')

      const continueButton = getByRole(document, 'button', {
        name: 'Save and continue'
      })
      expect(continueButton).toBeInTheDocument()

      const cancelButton = getByText(document, 'Cancel')
      expect(cancelButton).toBeInTheDocument()
    })

    test('should include OpenLayers CSS for map styling', async () => {
      const siteDetailsOverride = {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: { latitude: '50.123456', longitude: '-1.234567' }
      }

      const document = await getPageDocument(
        createMockExemption(siteDetailsOverride)
      )

      const olCssLink = document.querySelector(
        'link[href="/public/stylesheets/ol.css"]'
      )
      expect(olCssLink).toBeInTheDocument()
      expect(olCssLink.getAttribute('rel')).toBe('stylesheet')
    })
  })

  describe('Form Submission', () => {
    test('should handle successful form submission', async () => {
      const siteDetailsOverride = {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: { latitude: '50.123456', longitude: '-1.234567' },
        circleWidth: '200'
      }

      const exemption = createMockExemption(siteDetailsOverride)
      jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(exemption)

      const response = await server.inject({
        method: 'POST',
        url: routes.REVIEW_SITE_DETAILS,
        payload: {
          csrfToken: 'valid-token'
        }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
    })
  })

  describe('Data Validation', () => {
    test('should handle missing site details gracefully', async () => {
      const exemption = createMockExemption({})

      const document = await getPageDocument(exemption)

      validateMapContainer(document)

      const dataScript = document.querySelector('#site-details-data')
      expect(dataScript).toBeInTheDocument()

      const siteData = JSON.parse(dataScript.textContent)
      expect(siteData).toBeDefined()
    })

    test('should handle invalid coordinate formats', async () => {
      expect.hasAssertions()
      const siteDetailsOverride = {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: { latitude: 'invalid', longitude: 'coordinates' },
        circleWidth: null
      }

      const document = await getPageDocument(
        createMockExemption(siteDetailsOverride)
      )

      validateMapContainer(document)
      validateSiteDetailsData(document, {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: { latitude: 'invalid', longitude: 'coordinates' }
      })
    })
  })
})
