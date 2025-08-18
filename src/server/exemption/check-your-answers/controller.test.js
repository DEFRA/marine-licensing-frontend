import { JSDOM } from 'jsdom'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as coordinateUtils from '~/src/server/common/helpers/coordinate-utils.js'
import * as reviewUtils from '~/src/server/exemption/site-details/review-site-details/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authUtils from '~/src/server/common/plugins/auth/utils.js'

const CSS_SELECTORS = {
  checkYourAnswersHeading: '#check-your-answers-heading',
  backLink: '.govuk-back-link',
  form: 'form',
  submitButton: '#confirm-and-send',
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
  headings: {
    checkYourAnswers: 'Check your answers before sending your information'
  },
  backLink: 'Go back to your project',
  cardTitles: {
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
      'Manually enter one set of coordinates and a width to create a circular site'
  },
  fileTypes: {
    kml: 'KML',
    shapefile: 'Shapefile'
  },
  fallbacks: {
    unknownFile: 'Unknown file'
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

const getCardKey = (document, cardSelector, rowIndex) => {
  return document
    .querySelector(
      `${cardSelector} ${CSS_SELECTORS.summaryList.row}:nth-child(${rowIndex}) ${CSS_SELECTORS.summaryList.key}`
    )
    ?.textContent.trim()
}

const getSummaryRowCount = (document, cardSelector) => {
  return document.querySelectorAll(
    `${cardSelector} ${CSS_SELECTORS.summaryList.row}`
  ).length
}

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ')

const mockUserSession = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  sessionId: 'test-session-123'
}

const createExemptionWithSiteDetails = (siteDetailsOverrides = {}) => ({
  ...mockExemption,
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

const createWgs84Exemption = (
  latitude = '55.019889',
  longitude = '-1.399500'
) =>
  createExemptionWithSiteDetails({
    coordinateSystem: 'wgs84',
    coordinates: { latitude, longitude }
  })

const createOsgb36Exemption = (eastings = '425053', northings = '564180') =>
  createExemptionWithSiteDetails({
    coordinateSystem: 'osgb36',
    coordinates: { eastings, northings }
  })

describe('check your answers controller', () => {
  let server
  let getExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({ payload: { value: mockExemption } })

    jest.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('POST /exemption/check-your-answers', () => {
    beforeEach(() => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'success',
          value: {
            applicationReference: 'APP-123456',
            submittedAt: '2025-01-01T10:00:00.000Z'
          }
        }
      })
    })

    test('Should submit exemption and redirect to confirmation page', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=APP-123456'
      )
      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/submit',
        {
          id: mockExemption.id,
          userName: mockUserSession.displayName,
          userEmail: mockUserSession.email
        }
      )
    })

    test('Should throw a 404 if exemption is not found', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })
      expect(statusCode).toBe(404)
    })

    test('Should handle API errors gracefully', async () => {
      jest
        .spyOn(authRequests, 'authenticatedPostRequest')
        .mockRejectedValue(new Error('API Error'))

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle unexpected API response format', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'error', error: 'Something went wrong' }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle API response with missing value', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: null }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should redirect even with missing applicationReference when value exists', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: {} }
      })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=undefined'
      )
    })

    test('Should handle API response with wrong message type', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'pending',
          value: { applicationReference: 'APP-123' }
        }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session is missing', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue(null)

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has missing displayName', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: null,
        email: 'test@example.com'
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has missing email', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: null
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has empty displayName', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: '',
        email: 'test@example.com'
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has empty email', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: ''
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })
  })

  test('Should throw a 404 if exemption is not found', async () => {
    getExemptionCacheSpy.mockReturnValueOnce({})
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data is not found from server', async () => {
    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValueOnce({ payload: {} })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data has no taskList', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: {
        value: {
          id: 'test-id'
        }
      }
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data value is null', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: {
        value: null
      }
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should handle API error when fetching exemption data', async () => {
    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockRejectedValueOnce(new Error('API connection failed'))
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(500)
  })

  test('Should handle malformed API response on GET request', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: null
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should render page when exemption has no siteDetails', async () => {
    const exemptionWithoutSiteDetails = {
      ...mockExemption,
      siteDetails: null
    }

    getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutSiteDetails)

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)
  })

  test('Should render a complete check your answers page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })

    expect(statusCode).toBe(200)
    const { document } = new JSDOM(result).window

    expect(
      document
        .querySelector(CSS_SELECTORS.checkYourAnswersHeading)
        .textContent.trim()
    ).toBe(EXPECTED_TEXT.headings.checkYourAnswers)
    expect(
      document.querySelector(CSS_SELECTORS.backLink).textContent.trim()
    ).toBe(EXPECTED_TEXT.backLink)

    expect(getCardKey(document, CSS_SELECTORS.cards.projectDetails, 1)).toBe(
      EXPECTED_TEXT.rowKeys.projectName
    )
    expect(getFirstRowValue(document, CSS_SELECTORS.cards.projectDetails)).toBe(
      mockExemption.projectName
    )

    expect(getFirstRowValue(document, CSS_SELECTORS.cards.activityDates)).toBe(
      '1 January 2025'
    )
    expect(
      document
        .querySelector(
          `${CSS_SELECTORS.cards.activityDates} ${CSS_SELECTORS.summaryList.row}:last-child ${CSS_SELECTORS.summaryList.value}`
        )
        .textContent.trim()
    ).toBe('1 January 2025')

    expect(
      getFirstRowValue(document, CSS_SELECTORS.cards.activityDetails)
    ).toBe(mockExemption.activityDescription)

    expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
      EXPECTED_TEXT.siteDetailsMethods.manualCircle
    )
    expect(
      normalizeWhitespace(
        getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
      )
    ).toBe(EXPECTED_TEXT.coordinateSystems.wgs84)
    expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
      `${mockExemption.siteDetails.coordinates.latitude}, ${mockExemption.siteDetails.coordinates.longitude}`
    )
    expect(getFourthRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
      `${mockExemption.siteDetails.circleWidth} metres`
    )

    expect(
      getFirstRowValue(
        document,
        CSS_SELECTORS.cards.publicRegister
      ).toUpperCase()
    ).toBe(mockExemption.publicRegister.consent.toUpperCase())

    const form = document.querySelector(CSS_SELECTORS.form)
    expect(form).toBeTruthy()
    expect(form.getAttribute('method')).toBe('post')

    const submitButton = document.querySelector(CSS_SELECTORS.submitButton)
    expect(submitButton).toBeTruthy()
    expect(form.contains(submitButton)).toBe(true)
  })

  test('Should display WGS84 coordinates correctly', async () => {
    const wgs84Exemption = createWgs84Exemption('55.019889', '-1.399500')
    getExemptionCacheSpy.mockReturnValueOnce(wgs84Exemption)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })

    expect(statusCode).toBe(200)
    const { document } = new JSDOM(result).window
    expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
      '55.019889, -1.399500'
    )
  })

  test('Should display OSGB36 coordinates correctly', async () => {
    const osgb36Exemption = createOsgb36Exemption('425053', '564180')
    getExemptionCacheSpy.mockReturnValueOnce(osgb36Exemption)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })

    expect(statusCode).toBe(200)
    const { document } = new JSDOM(result).window

    expect(
      normalizeWhitespace(
        getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
      )
    ).toBe(EXPECTED_TEXT.coordinateSystems.osgb36)
    expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
      '425053, 564180'
    )
  })

  describe('Site details processing functions', () => {
    test('Should handle exemption with undefined siteDetails', async () => {
      const exemptionWithUndefinedSiteDetails = {
        ...mockExemption,
        siteDetails: undefined
      }

      getExemptionCacheSpy.mockReturnValueOnce(
        exemptionWithUndefinedSiteDetails
      )

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })
      expect(statusCode).toBe(200)
    })

    test('Should handle manual coordinates with missing coordinates', async () => {
      const exemptionWithMissingCoords = createExemptionWithSiteDetails({
        coordinatesType: 'coordinates',
        coordinateSystem: 'wgs84',
        coordinates: null
      })

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingCoords)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })
      expect(statusCode).toBe(200)
    })

    test('Should handle manual coordinates with invalid coordinate system', async () => {
      const exemptionWithInvalidSystem = createExemptionWithSiteDetails({
        coordinatesType: 'coordinates',
        coordinateSystem: 'invalid_system',
        coordinates: { latitude: '55.0', longitude: '-1.0' }
      })

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithInvalidSystem)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })
      expect(statusCode).toBe(200)
    })

    test('Should handle multiple coordinates type', async () => {
      const exemptionWithMultipleCoords = createExemptionWithSiteDetails({
        coordinatesType: 'coordinates',
        coordinatesEntry: 'multiple',
        coordinateSystem: 'wgs84',
        multipleCoordinates: [
          { latitude: '55.0', longitude: '-1.0' },
          { latitude: '56.0', longitude: '-1.5' }
        ]
      })

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMultipleCoords)

      const { statusCode, result } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window
      expect(document.querySelector('#site-details-card')).toBeTruthy()
    })
  })

  describe('ML-140: File upload site details display', () => {
    test('Should display KML file upload site details correctly', async () => {
      const kmlFileExemption = createFileUploadExemption(
        'kml',
        'hammersmith_coordinates.kml'
      )
      getExemptionCacheSpy.mockReturnValueOnce(kmlFileExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )
      expect(getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fileTypes.kml
      )
      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        'hammersmith_coordinates.kml'
      )
    })

    test('Should display Shapefile upload site details correctly', async () => {
      const shapefileExemption = createFileUploadExemption(
        'shapefile',
        'site_boundaries.shp',
        {
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [0, 0],
                      [1, 0],
                      [1, 1],
                      [0, 1],
                      [0, 0]
                    ]
                  ]
                }
              }
            ]
          }
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(shapefileExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )
      expect(getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fileTypes.shapefile
      )
      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        'site_boundaries.shp'
      )
    })

    test('Should handle file upload with missing geoJSON gracefully', async () => {
      const exemptionWithMissingGeoJSON = createFileUploadExemption(
        'kml',
        'incomplete_data.kml',
        {
          geoJSON: undefined
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingGeoJSON)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )
      expect(getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fileTypes.kml
      )
      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        'incomplete_data.kml'
      )
    })

    test('Should handle file upload with missing uploaded file data gracefully', async () => {
      const exemptionWithMissingFile = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'invalid_type',
          uploadedFile: {
            filename: 'test.invalid'
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingFile)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Shapefile')

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('test.invalid')
    })

    test('Should display "Unknown file" fallback when uploadedFile has no filename', async () => {
      const exemptionWithNoFilename = createFileUploadExemption(
        'invalid_type',
        '',
        {
          uploadedFile: {}
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNoFilename)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )
      expect(getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fileTypes.shapefile
      )
      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fallbacks.unknownFile
      )
    })

    test('Should display "Unknown file" fallback when uploadedFile is null', async () => {
      const exemptionWithNullFile = createFileUploadExemption(
        'invalid_type',
        '',
        {
          uploadedFile: null
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNullFile)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fallbacks.unknownFile
      )
    })

    test('Should display KML fallback when getFileUploadSummaryData fails for KML file', async () => {
      jest
        .spyOn(reviewUtils, 'getFileUploadSummaryData')
        .mockImplementation(() => {
          throw new Error('Mocked error for testing fallback')
        })

      const kmlExemptionWithError = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test.kml'
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(kmlExemptionWithError)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('KML')

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('test.kml')

      reviewUtils.getFileUploadSummaryData.mockRestore()
    })

    test('Should verify site details card structure for file uploads', async () => {
      const fileUploadExemption = createFileUploadExemption(
        'kml',
        'test_upload.kml',
        {
          geoJSON: { type: 'FeatureCollection', features: [] }
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      const siteDetailsCard = document.querySelector(
        CSS_SELECTORS.cards.siteDetails
      )
      expect(siteDetailsCard).toBeTruthy()

      const cardTitle = document.querySelector(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.card.title}`
      )
      expect(cardTitle?.textContent.trim()).toBe(
        EXPECTED_TEXT.cardTitles.siteDetails
      )

      const summaryRows = getSummaryRowCount(
        document,
        CSS_SELECTORS.cards.siteDetails
      )
      expect(summaryRows).toBe(4)

      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 1)).toBe(
        EXPECTED_TEXT.rowKeys.methodOfProviding
      )
      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 2)).toBe(
        EXPECTED_TEXT.rowKeys.fileType
      )
      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 3)).toBe(
        EXPECTED_TEXT.rowKeys.fileUploaded
      )
      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 4)).toBe(
        'Map view'
      )
    })

    test('Should handle file upload with empty geoJSON features array', async () => {
      const exemptionWithEmptyFeatures = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'empty_features.shp'
          },
          geoJSON: {
            type: 'FeatureCollection',
            features: []
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithEmptyFeatures)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Shapefile')

      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('empty_features.shp')
    })

    test('Should verify AC1 acceptance criteria - file upload site details display', async () => {
      const ac1FileUploadExemption = createFileUploadExemption(
        'kml',
        'Hammersmith_coordinates.kml',
        {
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [51.48967, -0.23153]
                }
              }
            ]
          }
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(ac1FileUploadExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )
      expect(getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fileTypes.kml
      )
      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        'Hammersmith_coordinates.kml'
      )

      const summaryRows = document.querySelectorAll(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.summaryList.row}`
      )
      const rowKeys = Array.from(summaryRows).map((row) =>
        row.querySelector(CSS_SELECTORS.summaryList.key)?.textContent.trim()
      )
      expect(rowKeys).toContain('Map view')

      const changeLink = document.querySelector(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.card.actions}`
      )
      expect(changeLink?.getAttribute('href')).toBe('#')
    })
  })

  describe('Controller error handling edge cases', () => {
    test('Should handle POST request with missing exemption cache', async () => {
      getExemptionCacheSpy.mockReturnValueOnce(null)

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle GET request with missing exemption cache', async () => {
      getExemptionCacheSpy.mockReturnValueOnce(null)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle getUserSession throwing an error', async () => {
      jest
        .spyOn(authUtils, 'getUserSession')
        .mockRejectedValueOnce(new Error('Session retrieval failed'))

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle validateAndFetchExemption with network timeout', async () => {
      jest
        .spyOn(authRequests, 'authenticatedGetRequest')
        .mockRejectedValueOnce(new Error('ECONNRESET'))

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle file upload processing error gracefully', async () => {
      // Mock getFileUploadSummaryData to throw an error
      jest
        .spyOn(reviewUtils, 'getFileUploadSummaryData')
        .mockImplementation(() => {
          throw new Error('File processing error')
        })

      const fileUploadExemption = createFileUploadExemption('kml', 'test.kml')
      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      const { statusCode, result } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      // Should fall back to basic display
      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )

      reviewUtils.getFileUploadSummaryData.mockRestore()
    })

    test('Should handle file upload with missing uploadedFile completely', async () => {
      const exemptionWithMissingUploadedFile = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'invalid',
          uploadedFile: undefined
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingUploadedFile)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fallbacks.unknownFile
      )
    })
  })

  describe('ML-68: Map view integration and siteDetailsData generation', () => {
    test('Should generate siteDetailsData with WGS84 coordinate system', async () => {
      const testExemption = createWgs84Exemption('55.019889', '-1.399500')
      getExemptionCacheSpy.mockReturnValueOnce(testExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window
      const siteDetailsScript = document.querySelector('#site-details-data')
      expect(siteDetailsScript).toBeTruthy()

      const siteDetailsData = JSON.parse(siteDetailsScript.textContent.trim())
      expect(siteDetailsData).toEqual({
        coordinatesType: 'coordinates',
        coordinateSystem: 'wgs84',
        coordinatesEntry: 'single',
        coordinates: { latitude: '55.019889', longitude: '-1.399500' },
        circleWidth: '100'
      })
    })

    test('Should generate siteDetailsData for file upload site details', async () => {
      const fileUploadExemption = createFileUploadExemption('kml', 'test.kml')
      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window
      const siteDetailsScript = document.querySelector('#site-details-data')
      expect(siteDetailsScript).toBeTruthy()

      const siteDetailsData = JSON.parse(siteDetailsScript.textContent.trim())
      expect(siteDetailsData.coordinatesType).toBe('file')
      expect(siteDetailsData.fileUploadType).toBe('kml')
      expect(siteDetailsData.uploadedFile).toEqual({ filename: 'test.kml' })
      expect(siteDetailsData.geoJSON).toEqual({
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
      })
    })

    test('Should include valid JSON in site details data script tag', async () => {
      const testExemption = createWgs84Exemption()
      getExemptionCacheSpy.mockReturnValueOnce(testExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window
      const siteDetailsScript = document.querySelector('#site-details-data')
      expect(siteDetailsScript).toBeTruthy()
      expect(siteDetailsScript.type).toBe('application/json')

      expect(() =>
        JSON.parse(siteDetailsScript.textContent.trim())
      ).not.toThrow()

      const siteDetailsData = JSON.parse(siteDetailsScript.textContent.trim())
      expect(siteDetailsData).toHaveProperty('coordinatesType')
      expect(siteDetailsData).toHaveProperty('coordinateSystem')
    })

    test('Should include site details data script tag with coordinates data in HTML output', async () => {
      const testExemption = createWgs84Exemption('55.019889', '-1.399500')
      getExemptionCacheSpy.mockReturnValueOnce(testExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      const siteDetailsScript = document.querySelector('#site-details-data')
      expect(siteDetailsScript).toBeTruthy()
      expect(siteDetailsScript.type).toBe('application/json')

      const scriptContent = siteDetailsScript.textContent.trim()
      expect(scriptContent).toContain('coordinatesType')
      expect(scriptContent).toContain('coordinateSystem')
      expect(scriptContent).toContain('wgs84')
      expect(scriptContent).toContain('55.019889')
      expect(scriptContent).toContain('-1.399500')
    })

    test('Should include Map view row for file upload site details', async () => {
      const fileUploadExemption = createFileUploadExemption('kml', 'site.kml')
      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      const summaryRows = document.querySelectorAll(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.summaryList.row}`
      )
      const rowKeys = Array.from(summaryRows).map((row) =>
        row.querySelector(CSS_SELECTORS.summaryList.key)?.textContent.trim()
      )

      expect(rowKeys).toContain('Map view')

      const mapViewRow = Array.from(summaryRows).find(
        (row) =>
          row
            .querySelector(CSS_SELECTORS.summaryList.key)
            ?.textContent.trim() === 'Map view'
      )
      expect(mapViewRow).toBeTruthy()

      const mapViewValue = mapViewRow.querySelector(
        CSS_SELECTORS.summaryList.value
      )
      expect(mapViewValue.innerHTML).toContain('app-site-details-map')
      expect(mapViewValue.innerHTML).toContain('data-module="site-details-map"')
    })

    test('Should include Map view row for manual coordinate site details', async () => {
      const manualExemption = createWgs84Exemption('55.019889', '-1.399500')
      getExemptionCacheSpy.mockReturnValueOnce(manualExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      const summaryRows = document.querySelectorAll(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.summaryList.row}`
      )
      const rowKeys = Array.from(summaryRows).map((row) =>
        row.querySelector(CSS_SELECTORS.summaryList.key)?.textContent.trim()
      )

      expect(rowKeys).toContain('Map view')

      const mapViewRow = Array.from(summaryRows).find(
        (row) =>
          row
            .querySelector(CSS_SELECTORS.summaryList.key)
            ?.textContent.trim() === 'Map view'
      )
      expect(mapViewRow).toBeTruthy()

      const mapViewValue = mapViewRow.querySelector(
        CSS_SELECTORS.summaryList.value
      )
      expect(mapViewValue.innerHTML).toContain('app-site-details-map')
      expect(mapViewValue.innerHTML).toContain('data-module="site-details-map"')
    })

    test('Should handle null siteDetails gracefully and generate appropriate JSON', async () => {
      const exemptionWithoutSiteDetails = {
        ...mockExemption,
        siteDetails: null
      }
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutSiteDetails)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window
      const siteDetailsScript = document.querySelector('#site-details-data')
      expect(siteDetailsScript).toBeTruthy()

      const siteDetailsData = JSON.parse(siteDetailsScript.textContent.trim())
      expect(siteDetailsData).toEqual({
        coordinatesType: 'none',
        coordinateSystem: null
      })
    })

    test('Should include OpenLayers CSS link in HTML head', async () => {
      const testExemption = createWgs84Exemption()
      getExemptionCacheSpy.mockReturnValueOnce(testExemption)

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      expect(result).toContain(
        '<link href="/public/stylesheets/ol.css" rel="stylesheet">'
      )
    })

    test('Should generate siteDetailsData with OSGB36 coordinate system', async () => {
      const osgb36Exemption = createOsgb36Exemption('425053', '564180')
      getExemptionCacheSpy.mockReturnValueOnce(osgb36Exemption)

      jest
        .spyOn(coordinateUtils, 'getCoordinateSystem')
        .mockReturnValueOnce({ coordinateSystem: 'osgb36' })

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window
      const siteDetailsScript = document.querySelector('#site-details-data')
      expect(siteDetailsScript).toBeTruthy()

      const siteDetailsData = JSON.parse(siteDetailsScript.textContent.trim())
      expect(siteDetailsData).toEqual({
        coordinatesType: 'coordinates',
        coordinateSystem: 'osgb36',
        coordinatesEntry: 'single',
        coordinates: { eastings: '425053', northings: '564180' },
        circleWidth: '100'
      })
    })
  })
})
