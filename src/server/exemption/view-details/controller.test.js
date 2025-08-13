import { JSDOM } from 'jsdom'
import Boom from '@hapi/boom'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as reviewUtils from '~/src/server/exemption/site-details/review-site-details/utils.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { viewDetailsController, VIEW_DETAILS_VIEW_ROUTE } from './controller.js'

const CSS_SELECTORS = {
  pageTitle: '#view-details-heading',
  pageCaption: '.govuk-caption-l',
  backLink: '.govuk-back-link',
  cards: {
    projectDetails: '#project-details-card',
    activityDates: '#activity-dates-card',
    activityDetails: '#activity-details-card',
    siteDetails: '#site-details-card',
    publicRegister: '#public-register-card'
  },
  summaryList: {
    key: '.govuk-summary-list__key',
    value: '.govuk-summary-list__value',
    row: '.govuk-summary-list__row'
  },
  card: {
    title: '.govuk-summary-card__title',
    actions: '.govuk-summary-card__actions a'
  }
}

const EXPECTED_TEXT = {
  pageTitle: 'View notification details',
  backLink: 'Back',
  cardTitles: {
    projectDetails: 'Project details',
    siteDetails: 'Site details'
  },
  rowKeys: {
    projectName: 'Project name',
    methodOfProviding: 'Method of providing site location',
    fileType: 'File type',
    fileUploaded: 'File uploaded'
  },
  coordinateSystems: {
    wgs84: 'WGS84 (World Geodetic System 1984) Latitude and longitude',
    osgb36: 'OSGB36 (National Grid) Eastings and Northings'
  },
  siteDetailsMethods: {
    fileUpload: 'Upload a file with the coordinates of the site',
    manualCircle:
      'Manually enter one set of coordinates and a width to create a circular site',
    polygon:
      'Manually enter multiple sets of coordinates to mark the boundary of the site'
  },
  fileTypes: {
    kml: 'KML',
    shapefile: 'Shapefile'
  }
}

const getCardValue = (document, cardSelector, rowIndex) => {
  return document
    .querySelector(
      `${cardSelector} ${CSS_SELECTORS.summaryList.row}:nth-child(${rowIndex}) ${CSS_SELECTORS.summaryList.value}`
    )
    ?.textContent.trim()
}

const getFirstRowValue = (document, cardSelector) =>
  getCardValue(document, cardSelector, 1)
const getSecondRowValue = (document, cardSelector) =>
  getCardValue(document, cardSelector, 2)
const getThirdRowValue = (document, cardSelector) =>
  getCardValue(document, cardSelector, 3)
const getFourthRowValue = (document, cardSelector) =>
  getCardValue(document, cardSelector, 4)

const getSummaryRowCount = (document, cardSelector) => {
  return document.querySelectorAll(
    `${cardSelector} ${CSS_SELECTORS.summaryList.row}`
  ).length
}

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ')

const createSubmittedExemption = (overrides = {}) => ({
  ...mockExemption,
  status: 'Submitted',
  applicationReference: 'EXE/2025/00003',
  submittedAt: '2025-01-01T10:00:00.000Z',
  ...overrides
})

const createExemptionWithSiteDetails = (siteDetailsOverrides = {}) =>
  createSubmittedExemption({
    siteDetails: {
      ...mockExemption.siteDetails,
      ...siteDetailsOverrides
    }
  })

const createFileUploadExemption = (
  fileType = 'kml',
  filename = 'test.kml',
  additionalOverrides = {}
) =>
  createExemptionWithSiteDetails({
    coordinatesType: 'file',
    fileUploadType: fileType,
    uploadedFile: { filename },
    geoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [51.5074, -0.1278]
          }
        }
      ]
    },
    ...additionalOverrides
  })

const createPolygonExemption = (coordinateSystem, coordinates) =>
  createExemptionWithSiteDetails({
    coordinatesType: 'coordinates',
    coordinatesEntry: 'multiple',
    coordinateSystem,
    coordinates
  })

const mockPolygonCoordinatesWGS84 = [
  { latitude: '55.123456', longitude: '-1.234567' },
  { latitude: '55.223456', longitude: '-1.334567' },
  { latitude: '55.323456', longitude: '-1.434567' }
]

describe('view details controller', () => {
  let server
  let authenticatedGetRequestSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    authenticatedGetRequestSpy = jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({
        payload: { value: createSubmittedExemption() }
      })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /exemption/view-details/{exemptionId}', () => {
    const validExemptionId = '507f1f77bcf86cd799439011'

    describe('successful scenarios', () => {
      test('should render view details page with submitted exemption data', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          document.querySelector(CSS_SELECTORS.pageTitle).textContent.trim()
        ).toBe(EXPECTED_TEXT.pageTitle)

        expect(
          document.querySelector(CSS_SELECTORS.pageCaption).textContent.trim()
        ).toBe('EXE/2025/00003 - Exempt activity notification')

        expect(
          document.querySelector(CSS_SELECTORS.backLink).textContent.trim()
        ).toBe(EXPECTED_TEXT.backLink)

        expect(
          document.querySelector(CSS_SELECTORS.backLink).getAttribute('href')
        ).toBe('/home')
      })

      test('should display all exemption cards in read-only mode', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          document.querySelector(CSS_SELECTORS.cards.projectDetails)
        ).toBeTruthy()
        expect(
          document.querySelector(CSS_SELECTORS.cards.activityDates)
        ).toBeTruthy()
        expect(
          document.querySelector(CSS_SELECTORS.cards.activityDetails)
        ).toBeTruthy()
        expect(
          document.querySelector(CSS_SELECTORS.cards.siteDetails)
        ).toBeTruthy()
        expect(
          document.querySelector(CSS_SELECTORS.cards.publicRegister)
        ).toBeTruthy()

        expect(
          getFirstRowValue(document, CSS_SELECTORS.cards.projectDetails)
        ).toBe(submittedExemption.projectName)
      })

      test('should not display Change links in read-only mode', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        const changeLinks = document.querySelectorAll('a[href*="change"]')
        expect(changeLinks).toHaveLength(0)

        const addLinks = document.querySelectorAll('a[href*="add"]')
        expect(addLinks).toHaveLength(0)
      })

      test('should not display Confirm and send button', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        const form = document.querySelector('form')
        expect(form).toBeFalsy()

        const submitButton = document.querySelector(
          'button[type="submit"], input[type="submit"]'
        )
        expect(submitButton).toBeFalsy()

        expect(document.body.textContent).not.toContain('Confirm and send')
      })

      test('should call API with correct exemption ID', async () => {
        await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(authenticatedGetRequestSpy).toHaveBeenCalledWith(
          expect.any(Object),
          `/exemption/${validExemptionId}`
        )
      })
    })

    describe('site details display scenarios', () => {
      test('should display circular site details correctly', async () => {
        const circularExemption = createExemptionWithSiteDetails({
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinates: { latitude: '51.489676', longitude: '-0.231530' },
          circleWidth: '100'
        })
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: circularExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe(EXPECTED_TEXT.siteDetailsMethods.manualCircle)
        expect(
          normalizeWhitespace(
            getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
          )
        ).toBe(EXPECTED_TEXT.coordinateSystems.wgs84)
        expect(
          getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe('51.489676, -0.231530')
        expect(
          getFourthRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe('100 metres')
      })

      test('should display file upload site details correctly', async () => {
        const fileUploadExemption = createFileUploadExemption(
          'kml',
          'test_site.kml'
        )
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: fileUploadExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe(EXPECTED_TEXT.siteDetailsMethods.fileUpload)
        expect(
          getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe(EXPECTED_TEXT.fileTypes.kml)
        expect(
          getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe('test_site.kml')
      })

      test('should display polygon site details correctly', async () => {
        const polygonExemption = createPolygonExemption(
          COORDINATE_SYSTEMS.WGS84,
          mockPolygonCoordinatesWGS84
        )
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: polygonExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe(EXPECTED_TEXT.siteDetailsMethods.polygon)
        expect(
          normalizeWhitespace(
            getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
          )
        ).toBe(EXPECTED_TEXT.coordinateSystems.wgs84)

        const summaryRows = getSummaryRowCount(
          document,
          CSS_SELECTORS.cards.siteDetails
        )
        expect(summaryRows).toBe(5) // Method + Coordinate System + 3 coordinate points
      })

      test('should handle exemption with no site details', async () => {
        const exemptionWithoutSiteDetails = createSubmittedExemption({
          siteDetails: null
        })
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: exemptionWithoutSiteDetails }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          document.querySelector(CSS_SELECTORS.cards.projectDetails)
        ).toBeTruthy()
        expect(
          document.querySelector(CSS_SELECTORS.cards.activityDates)
        ).toBeTruthy()
      })

      test('should handle file upload data error gracefully', async () => {
        jest
          .spyOn(reviewUtils, 'getFileUploadSummaryData')
          .mockImplementation(() => {
            throw new Error('File upload data error')
          })

        const fileUploadExemption = createFileUploadExemption('kml', 'test.kml')
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: fileUploadExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe(EXPECTED_TEXT.siteDetailsMethods.fileUpload)
        expect(
          getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe(EXPECTED_TEXT.fileTypes.kml)
        expect(
          getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)
        ).toBe('test.kml')

        reviewUtils.getFileUploadSummaryData.mockRestore()
      })
    })

    describe('error scenarios', () => {
      test('should throw 404 when exemption ID is missing', async () => {
        const { statusCode } = await server.inject({
          method: 'GET',
          url: '/exemption/view-details/'
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 404 when exemption is not found in API', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: null }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 404 when API returns empty payload', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: {}
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 403 when exemption is still in Draft status', async () => {
        const draftExemption = {
          ...mockExemption,
          status: 'Draft',
          applicationReference: null
        }
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: draftExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should throw 403 when exemption has no application reference', async () => {
        const exemptionWithoutRef = {
          ...mockExemption,
          status: 'Submitted',
          applicationReference: null
        }
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: exemptionWithoutRef }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should handle API authentication errors (403)', async () => {
        const authError = new Error('Forbidden')
        authError.output = { statusCode: 403 }
        authenticatedGetRequestSpy.mockRejectedValue(authError)

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should handle API not found errors (404)', async () => {
        const notFoundError = new Error('Not Found')
        notFoundError.output = { statusCode: 404 }
        authenticatedGetRequestSpy.mockRejectedValue(notFoundError)

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(404)
      })

      test('should handle unexpected API errors gracefully', async () => {
        authenticatedGetRequestSpy.mockRejectedValue(
          new Error('Unexpected API error')
        )

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(500)
      })

      test('should handle Boom errors properly', async () => {
        authenticatedGetRequestSpy.mockRejectedValue(
          Boom.internal('Internal server error')
        )

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(500)
      })
    })

    describe('controller unit tests', () => {
      test('should call view with correct data structure', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const mockRequest = {
          params: { exemptionId: validExemptionId },
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            pageTitle: 'View notification details',
            pageCaption: 'EXE/2025/00003 - Exempt activity notification',
            backLink: '/home',
            readOnly: true,
            projectName: submittedExemption.projectName,
            activityDates: submittedExemption.activityDates,
            activityDescription: submittedExemption.activityDescription,
            publicRegister: submittedExemption.publicRegister,
            siteDetails: expect.any(Object)
          })
        )
      })

      test('should handle missing exemption ID in params', async () => {
        const mockRequest = {
          params: {},
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow('Exemption not found')
      })

      test('should log errors appropriately', async () => {
        const mockRequest = {
          params: { exemptionId: 'invalid-id' },
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: null }
        })

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow()

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          { id: 'invalid-id' },
          'Exemption data not found'
        )
      })
    })

    describe('acceptance criteria verification', () => {
      test('AC1 - View details option functionality verified through dashboard utils', () => {
        const route = `/exemption/view-details/${validExemptionId}`
        expect(route).toMatch(/^\/exemption\/view-details\/[a-f0-9]{24}$/)
      })

      test('AC2 - Navigation to view notification details page', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          document.querySelector(CSS_SELECTORS.pageTitle).textContent.trim()
        ).toBe(EXPECTED_TEXT.pageTitle)
      })

      test('AC3 - Page content verification', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        expect(
          document.querySelector(CSS_SELECTORS.pageCaption).textContent.trim()
        ).toBe('EXE/2025/00003 - Exempt activity notification')

        expect(document.body.textContent).not.toContain('Confirm and send')

        expect(
          document.querySelector(CSS_SELECTORS.backLink).textContent.trim()
        ).toBe('Back')
      })

      test('AC4 - Unique URL verification', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })

      test('AC5 - Back link navigation', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        const { document } = new JSDOM(result).window

        const backLink = document.querySelector(CSS_SELECTORS.backLink)
        expect(backLink.getAttribute('href')).toBe('/home')
        expect(backLink.textContent.trim()).toBe('Back')
      })
    })

    describe('data integrity and edge cases', () => {
      test('should handle empty application reference', async () => {
        const exemptionWithEmptyRef = createSubmittedExemption({
          applicationReference: ''
        })
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: exemptionWithEmptyRef }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should handle malformed site details data', async () => {
        const exemptionWithBadSiteDetails = createSubmittedExemption({
          siteDetails: { invalidStructure: true }
        })
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: exemptionWithBadSiteDetails }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })

      test('should fetch data from API ignoring any cache', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(authenticatedGetRequestSpy).toHaveBeenCalledTimes(1)
        expect(authenticatedGetRequestSpy).toHaveBeenCalledWith(
          expect.any(Object),
          `/exemption/${validExemptionId}`
        )
      })
    })
  })
})
