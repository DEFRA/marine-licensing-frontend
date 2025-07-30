import { JSDOM } from 'jsdom'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'

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
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)

    const { document } = new JSDOM(result).window
    expect(
      document.querySelector('#check-your-answers-heading').textContent.trim()
    ).toBe('Check your answers before sending your information')

    expect(document.querySelector('.govuk-back-link').textContent.trim()).toBe(
      'Go back to your project'
    )

    expect(
      document
        .querySelector('#project-details-card .govuk-summary-list__key')
        .textContent.trim()
    ).toBe('Project name')

    expect(
      document
        .querySelector(
          '#project-details-card .govuk-summary-list .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.projectName)

    expect(
      document
        .querySelector(
          '#activity-dates-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('1 January 2025')

    expect(
      document
        .querySelector(
          '#activity-dates-card .govuk-summary-list .govuk-summary-list__row:last-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('1 January 2025')

    expect(
      document
        .querySelector(
          '#activity-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.activityDescription)

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(
      'Manually enter one set of coordinates and a width to create a circular site'
    )

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
        )
        .textContent.trim()
        .replace(/\s+/g, ' ')
    ).toBe('WGS84 (World Geodetic System 1984) Latitude and longitude')

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(
      mockExemption.siteDetails.coordinates.latitude +
        ', ' +
        mockExemption.siteDetails.coordinates.longitude
    )

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(4) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe(mockExemption.siteDetails.circleWidth + ' metres')

    expect(
      document
        .querySelector(
          '#public-register-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
        )
        .textContent.trim()
        .toUpperCase()
    ).toBe(mockExemption.publicRegister.consent.toUpperCase())

    // Verify the form is present and configured correctly
    const form = document.querySelector('form')
    expect(form).toBeTruthy()
    expect(form.getAttribute('method')).toBe('post')

    // Verify the submit button is inside the form
    const submitButton = document.querySelector('#confirm-and-send')
    expect(submitButton).toBeTruthy()
    expect(form.contains(submitButton)).toBe(true)
  })

  test('Should display WGS84 coordinates correctly', async () => {
    const wgs84Exemption = {
      ...mockExemption,
      siteDetails: {
        ...mockExemption.siteDetails,
        coordinateSystem: 'wgs84',
        coordinates: {
          latitude: '55.019889',
          longitude: '-1.399500'
        }
      }
    }

    getExemptionCacheSpy.mockReturnValueOnce(wgs84Exemption)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)

    const { document } = new JSDOM(result).window
    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('55.019889, -1.399500')
  })

  test('Should display OSGB36 coordinates correctly', async () => {
    const osgb36Exemption = {
      ...mockExemption,
      siteDetails: {
        ...mockExemption.siteDetails,
        coordinateSystem: 'osgb36',
        coordinates: {
          eastings: '425053',
          northings: '564180'
        }
      }
    }

    getExemptionCacheSpy.mockReturnValueOnce(osgb36Exemption)

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)

    const { document } = new JSDOM(result).window
    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
        )
        .textContent.trim()
        .replace(/\s+/g, ' ')
    ).toBe('OSGB36 (National Grid) Eastings and Northings')

    expect(
      document
        .querySelector(
          '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
        )
        .textContent.trim()
    ).toBe('425053, 564180')
  })

  describe('ML-140: File upload site details display', () => {
    test('Should display KML file upload site details correctly', async () => {
      // Given: An exemption with KML file upload site details
      const kmlFileExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'hammersmith_coordinates.kml'
          },
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
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(kmlFileExemption)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and displays KML file upload details
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify method of providing site location
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      // Verify file type is displayed as KML
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('KML')

      // Verify filename is displayed with extension
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('hammersmith_coordinates.kml')
    })

    test('Should display Shapefile upload site details correctly', async () => {
      // Given: An exemption with Shapefile upload site details
      const shapefileExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'site_boundaries.shp'
          },
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
      }

      getExemptionCacheSpy.mockReturnValueOnce(shapefileExemption)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and displays Shapefile upload details
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify method of providing site location
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      // Verify file type is displayed as Shapefile
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Shapefile')

      // Verify filename is displayed with extension
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('site_boundaries.shp')
    })

    test('Should handle file upload with missing geoJSON gracefully', async () => {
      // Given: An exemption with file upload but missing geoJSON data
      const exemptionWithMissingGeoJSON = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'incomplete_data.kml'
          }
          // Missing geoJSON property
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithMissingGeoJSON)

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

      // Verify file type is displayed correctly even without geoJSON
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
      ).toBe('incomplete_data.kml')
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
      const exemptionWithNoFilename = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'invalid_type', // Invalid type triggers error in getFileUploadSummaryData
          uploadedFile: {} // No filename property to trigger 'Unknown file' fallback on line 69
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNoFilename)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with 'Unknown file' fallback display
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

      // Verify file type fallback
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Shapefile')

      // Verify 'Unknown file' fallback is triggered
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Unknown file')
    })

    test('Should display "Unknown file" fallback when uploadedFile is null', async () => {
      // Given: An exemption that triggers getFileUploadSummaryData error AND has null uploadedFile
      const exemptionWithNullFile = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'invalid_type', // Invalid type triggers error in getFileUploadSummaryData
          uploadedFile: null // Null uploadedFile triggers 'Unknown file' fallback on line 69
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNullFile)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful with 'Unknown file' fallback display
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify 'Unknown file' fallback is triggered
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Unknown file')
    })

    test('Should verify site details card structure for file uploads', async () => {
      // Given: An exemption with file upload site details
      const fileUploadExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test_upload.kml'
          },
          geoJSON: {
            type: 'FeatureCollection',
            features: []
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: Response is successful and site details card structure is correct
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // Verify site details card exists
      const siteDetailsCard = document.querySelector('#site-details-card')
      expect(siteDetailsCard).toBeTruthy()

      // Verify card title
      const cardTitle = document.querySelector(
        '#site-details-card .govuk-summary-card__title'
      )
      expect(cardTitle?.textContent.trim()).toBe('Site details')

      // Verify expected number of rows for file upload (3 rows: method, file type, filename)
      const summaryRows = document.querySelectorAll(
        '#site-details-card .govuk-summary-list__row'
      )
      expect(summaryRows).toHaveLength(3)

      // Verify row keys are correct
      const firstRowKey = summaryRows[0].querySelector(
        '.govuk-summary-list__key'
      )
      expect(firstRowKey?.textContent.trim()).toBe(
        'Method of providing site location'
      )

      const secondRowKey = summaryRows[1].querySelector(
        '.govuk-summary-list__key'
      )
      expect(secondRowKey?.textContent.trim()).toBe('File type')

      const thirdRowKey = summaryRows[2].querySelector(
        '.govuk-summary-list__key'
      )
      expect(thirdRowKey?.textContent.trim()).toBe('File uploaded')
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
      const ac1FileUploadExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'Hammersmith_coordinates.kml'
          },
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
      }

      getExemptionCacheSpy.mockReturnValueOnce(ac1FileUploadExemption)

      // When: User views the check your answers page
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      // Then: AC1 requirements are met
      expect(statusCode).toBe(200)

      const { document } = new JSDOM(result).window

      // AC1: Method of providing site location - populated with fixed text
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:first-child .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Upload a file with the coordinates of the site')

      // AC1: File type - populated with "KML"
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('KML')

      // AC1: File uploaded - populated with filename including extension
      expect(
        document
          .querySelector(
            '#site-details-card .govuk-summary-list .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value'
          )
          .textContent.trim()
      ).toBe('Hammersmith_coordinates.kml')

      // AC1: Map view row should NOT be present (out of scope)
      const summaryRows = document.querySelectorAll(
        '#site-details-card .govuk-summary-list__row'
      )
      const rowKeys = Array.from(summaryRows).map((row) =>
        row.querySelector('.govuk-summary-list__key')?.textContent.trim()
      )
      expect(rowKeys).not.toContain('Map view')

      // AC1: Change link should NOT be functional (out of scope)
      const changeLink = document.querySelector(
        '#site-details-card .govuk-summary-card__actions a'
      )
      expect(changeLink?.getAttribute('href')).toBe('#')
    })
  })
})
