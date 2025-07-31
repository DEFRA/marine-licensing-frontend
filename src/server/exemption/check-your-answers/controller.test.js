import { JSDOM } from 'jsdom'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as reviewUtils from '~/src/server/exemption/site-details/review-site-details/utils.js'

// Test Constants
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

// DOM Helper Functions
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

// Test Data Builders
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
        { id: mockExemption.id }
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
          // Missing taskList property
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
    // Given: Default exemption data
    // When: User views the check your answers page
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })

    // Then: Page renders successfully with all expected content
    expect(statusCode).toBe(200)
    const { document } = new JSDOM(result).window

    // Verify page structure
    expect(
      document
        .querySelector(CSS_SELECTORS.checkYourAnswersHeading)
        .textContent.trim()
    ).toBe(EXPECTED_TEXT.headings.checkYourAnswers)
    expect(
      document.querySelector(CSS_SELECTORS.backLink).textContent.trim()
    ).toBe(EXPECTED_TEXT.backLink)

    // Verify project details card
    expect(getCardKey(document, CSS_SELECTORS.cards.projectDetails, 1)).toBe(
      EXPECTED_TEXT.rowKeys.projectName
    )
    expect(getFirstRowValue(document, CSS_SELECTORS.cards.projectDetails)).toBe(
      mockExemption.projectName
    )

    // Verify activity dates card
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

    // Verify activity details card
    expect(
      getFirstRowValue(document, CSS_SELECTORS.cards.activityDetails)
    ).toBe(mockExemption.activityDescription)

    // Verify site details card (manual coordinates)
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

    // Verify public register card
    expect(
      getFirstRowValue(
        document,
        CSS_SELECTORS.cards.publicRegister
      ).toUpperCase()
    ).toBe(mockExemption.publicRegister.consent.toUpperCase())

    // Verify form structure
    const form = document.querySelector(CSS_SELECTORS.form)
    expect(form).toBeTruthy()
    expect(form.getAttribute('method')).toBe('post')

    const submitButton = document.querySelector(CSS_SELECTORS.submitButton)
    expect(submitButton).toBeTruthy()
    expect(form.contains(submitButton)).toBe(true)
  })

  test('Should display WGS84 coordinates correctly', async () => {
    // Given: An exemption with WGS84 coordinates
    const wgs84Exemption = createWgs84Exemption('55.019889', '-1.399500')
    getExemptionCacheSpy.mockReturnValueOnce(wgs84Exemption)

    // When: User views the check your answers page
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })

    // Then: WGS84 coordinates are displayed correctly
    expect(statusCode).toBe(200)
    const { document } = new JSDOM(result).window
    expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
      '55.019889, -1.399500'
    )
  })

  test('Should display OSGB36 coordinates correctly', async () => {
    // Given: An exemption with OSGB36 coordinates
    const osgb36Exemption = createOsgb36Exemption('425053', '564180')
    getExemptionCacheSpy.mockReturnValueOnce(osgb36Exemption)

    // When: User views the check your answers page
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })

    // Then: OSGB36 coordinates are displayed correctly
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

  describe('ML-140: File upload site details display', () => {
    test('Should display KML file upload site details correctly', async () => {
      // Given: An exemption with KML file upload site details
      const kmlFileExemption = createFileUploadExemption(
        'kml',
        'hammersmith_coordinates.kml'
      )
      getExemptionCacheSpy.mockReturnValueOnce(kmlFileExemption)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and displays KML file upload details
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
      // Given: An exemption with Shapefile upload site details
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

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and displays Shapefile upload details
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
      // Given: An exemption with file upload but missing geoJSON data
      const exemptionWithMissingGeoJSON = createFileUploadExemption(
        'kml',
        'incomplete_data.kml',
        {
          geoJSON: undefined // Missing geoJSON property
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingGeoJSON)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with fallback display
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
      // Given: An exemption with file upload but invalid fileUploadType to trigger getFileUploadSummaryData error
      const exemptionWithMissingFile = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'invalid_type', // Invalid type triggers error in getFileUploadSummaryData
          uploadedFile: {
            filename: 'test.invalid'
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingFile)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with fallback display
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify fallback method text is displayed
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      // Verify file type falls back based on siteDetails.fileUploadType (but invalid_type defaults to Shapefile)
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Shapefile')

      // Verify fallback filename is displayed (from controller fallback logic)
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('test.invalid')
    })

    test('Should display "Unknown file" fallback when uploadedFile has no filename', async () => {
      // Given: An exemption that triggers getFileUploadSummaryData error AND has no filename
      const exemptionWithNoFilename = createFileUploadExemption(
        'invalid_type',
        '',
        {
          uploadedFile: {} // No filename property to trigger 'Unknown file' fallback
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNoFilename)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with 'Unknown file' fallback display
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
      // Given: An exemption that triggers getFileUploadSummaryData error AND has null uploadedFile
      const exemptionWithNullFile = createFileUploadExemption(
        'invalid_type',
        '',
        {
          uploadedFile: null // Null uploadedFile triggers 'Unknown file' fallback
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNullFile)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with 'Unknown file' fallback display
      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fallbacks.unknownFile
      )
    })

    test('Should display KML fallback when getFileUploadSummaryData fails for KML file', async () => {
      // Given: Mock getFileUploadSummaryData to throw an error to trigger fallback logic
      jest
        .spyOn(reviewUtils, 'getFileUploadSummaryData')
        .mockImplementation(() => {
          throw new Error('Mocked error for testing fallback')
        })

      const kmlExemptionWithError = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml', // KML type to test the KML branch in fallback
          uploadedFile: {
            filename: 'test.kml'
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(kmlExemptionWithError)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with KML fallback display
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify fallback method text is displayed
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      // Verify file type shows KML
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('KML')

      // Verify filename is displayed
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('test.kml')

      // Restore the mock
      reviewUtils.getFileUploadSummaryData.mockRestore()
    })

    test('Should verify site details card structure for file uploads', async () => {
      // Given: An exemption with file upload site details
      const fileUploadExemption = createFileUploadExemption(
        'kml',
        'test_upload.kml',
        {
          geoJSON: { type: 'FeatureCollection', features: [] }
        }
      )
      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and site details card structure is correct
      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      // Verify card structure and content
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
      expect(summaryRows).toBe(3)

      // Verify row keys are correct
      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 1)).toBe(
        EXPECTED_TEXT.rowKeys.methodOfProviding
      )
      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 2)).toBe(
        EXPECTED_TEXT.rowKeys.fileType
      )
      expect(getCardKey(document, CSS_SELECTORS.cards.siteDetails, 3)).toBe(
        EXPECTED_TEXT.rowKeys.fileUploaded
      )
    })

    test('Should handle file upload with empty geoJSON features array', async () => {
      // Given: An exemption with file upload but empty geoJSON features
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
            features: [] // Empty features array
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithEmptyFeatures)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and displays file upload details
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify basic file information is still displayed
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
      // Given: An exemption with uploaded site details meeting AC1 requirements
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

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: AC1 requirements are met
      expect(statusCode).toBe(200)
      const { document } = new JSDOM(result).window

      // AC1: Basic site details are displayed correctly
      expect(getFirstRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.siteDetailsMethods.fileUpload
      )
      expect(getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        EXPECTED_TEXT.fileTypes.kml
      )
      expect(getThirdRowValue(document, CSS_SELECTORS.cards.siteDetails)).toBe(
        'Hammersmith_coordinates.kml'
      )

      // AC1: Map view row should NOT be present (out of scope)
      const summaryRows = document.querySelectorAll(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.summaryList.row}`
      )
      const rowKeys = Array.from(summaryRows).map((row) =>
        row.querySelector(CSS_SELECTORS.summaryList.key)?.textContent.trim()
      )
      expect(rowKeys).not.toContain('Map view')

      // AC1: Change link should NOT be functional (out of scope)
      const changeLink = document.querySelector(
        `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.card.actions}`
      )
      expect(changeLink?.getAttribute('href')).toBe('#')
    })
  })
})
