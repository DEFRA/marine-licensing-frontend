import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '~/src/server/common/plugins/auth/utils.js'
import * as exemptionSiteDetailsHelpers from '~/src/server/common/helpers/exemption-site-details.js'

const mockUserSession = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  sessionId: 'test-session-123'
}

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

  afterEach(() => {
    jest.restoreAllMocks()
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

    test('Should handle file upload processing error and use fallback data', async () => {
      const fileUploadExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test.kml'
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      const mockProcessedSiteDetails = {
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'KML',
        filename: 'test.kml'
      }

      const processSiteDetailsSpy = jest
        .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
        .mockReturnValue(mockProcessedSiteDetails)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      expect(processSiteDetailsSpy).toHaveBeenCalledWith(
        fileUploadExemption,
        fileUploadExemption.id,
        expect.any(Object)
      )
      processSiteDetailsSpy.mockRestore()
    })

    test('Should handle file upload processing error and use Shapefile and Unknown file fallbacks', async () => {
      const shapefileExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile',
          uploadedFile: {
            // No filename property - this should trigger 'Unknown file' fallback
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(shapefileExemption)

      const mockProcessedSiteDetails = {
        isFileUpload: true,
        method: 'Upload a file with the coordinates of the site',
        fileType: 'Shapefile',
        filename: 'Unknown file'
      }

      const processSiteDetailsSpy = jest
        .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
        .mockReturnValue(mockProcessedSiteDetails)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      expect(processSiteDetailsSpy).toHaveBeenCalledWith(
        shapefileExemption,
        shapefileExemption.id,
        expect.any(Object)
      )
      processSiteDetailsSpy.mockRestore()
    })
  })

  // describe('Polygon coordinate handling', () => {
  //   beforeEach(() => {
  //     jest
  //       .spyOn(reviewUtils, 'getPolygonCoordinatesDisplayData')
  //       .mockImplementation((siteDetails) => {
  //         if (siteDetails?.coordinateSystem === 'wgs84') {
  //           return (
  //             siteDetails.coordinates?.map((coord, index) => ({
  //               label:
  //                 index === 0 ? 'Start and end points' : `Point ${index + 1}`,
  //               value: `${coord.latitude}, ${coord.longitude}`
  //             })) || []
  //           )
  //         }
  //         if (siteDetails?.coordinateSystem === 'osgb36') {
  //           return (
  //             siteDetails.coordinates?.map((coord, index) => ({
  //               label:
  //                 index === 0 ? 'Start and end points' : `Point ${index + 1}`,
  //               value: `${coord.eastings}, ${coord.northings}`
  //             })) || []
  //           )
  //         }
  //         return []
  //       })
  //   })

  //   const setupPolygonMocks = (polygonExemption) => {
  //     getExemptionCacheSpy.mockReturnValue(polygonExemption)

  //     jest
  //       .spyOn(authRequests, 'authenticatedGetRequest')
  //       .mockResolvedValue({ payload: { value: polygonExemption } })
  //   }

  //   test('Should process polygon site details with coordinatesEntry multiple', async () => {
  //     const polygonExemption = createPolygonExemption('wgs84', [
  //       { latitude: '54.721000', longitude: '-1.595000' },
  //       { latitude: '54.725000', longitude: '-1.590000' },
  //       { latitude: '54.729000', longitude: '-1.585000' }
  //     ])

  //     setupPolygonMocks(polygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)

  //     expect(result).toContain(
  //       'Check your answers before sending your information'
  //     )

  //     expect(result).toContain(
  //       'Manually enter multiple sets of coordinates to mark the boundary of the site'
  //     )

  //     expect(result).toContain('WGS84 (World Geodetic System 1984)')

  //     expect(result).toContain('Start and end points')
  //     expect(result).toContain('Point 2')
  //     expect(result).toContain('Point 3')
  //   })

  //   test('Should display WGS84 polygon coordinates correctly with 3 points', async () => {
  //     const smallPolygonExemption = createPolygonExemption('wgs84', [
  //       { latitude: '54.721000', longitude: '-1.595000' },
  //       { latitude: '54.725000', longitude: '-1.590000' },
  //       { latitude: '54.729000', longitude: '-1.585000' }
  //     ])

  //     setupPolygonMocks(smallPolygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)
  //     const { document } = new JSDOM(result).window

  //     expect(
  //       normalizeWhitespace(
  //         getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
  //       )
  //     ).toBe(EXPECTED_TEXT.coordinateSystems.wgs84)

  //     expect(result).toContain('54.721000, -1.595000')
  //     expect(result).toContain('54.725000, -1.590000')
  //     expect(result).toContain('54.729000, -1.585000')
  //   })

  //   test('Should display OSGB36 polygon coordinates correctly with 3 points', async () => {
  //     const osgb36PolygonExemption = createPolygonExemption('osgb36', [
  //       { eastings: '425053', northings: '564180' },
  //       { eastings: '426000', northings: '565000' },
  //       { eastings: '427000', northings: '566000' }
  //     ])

  //     setupPolygonMocks(osgb36PolygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)
  //     const { document } = new JSDOM(result).window

  //     expect(
  //       normalizeWhitespace(
  //         getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
  //       )
  //     ).toBe(EXPECTED_TEXT.coordinateSystems.osgb36)

  //     expect(result).toContain('425053, 564180')
  //     expect(result).toContain('426000, 565000')
  //     expect(result).toContain('427000, 566000')
  //   })

  //   test('Should display WGS84 polygon coordinates correctly with 13 points', async () => {
  //     const largePolygonCoordinates = [
  //       { latitude: '54.720000', longitude: '-1.600000' },
  //       { latitude: '54.722000', longitude: '-1.598000' },
  //       { latitude: '54.724000', longitude: '-1.596000' },
  //       { latitude: '54.726000', longitude: '-1.594000' },
  //       { latitude: '54.728000', longitude: '-1.592000' },
  //       { latitude: '54.730000', longitude: '-1.590000' },
  //       { latitude: '54.732000', longitude: '-1.588000' },
  //       { latitude: '54.734000', longitude: '-1.586000' },
  //       { latitude: '54.736000', longitude: '-1.584000' },
  //       { latitude: '54.738000', longitude: '-1.582000' },
  //       { latitude: '54.740000', longitude: '-1.580000' },
  //       { latitude: '54.742000', longitude: '-1.578000' },
  //       { latitude: '54.744000', longitude: '-1.576000' }
  //     ]

  //     const largePolygonExemption = createPolygonExemption(
  //       'wgs84',
  //       largePolygonCoordinates
  //     )

  //     setupPolygonMocks(largePolygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)
  //     const { document } = new JSDOM(result).window

  //     // Verify all 13 coordinates are displayed
  //     expect(result).toContain('Start and end points')
  //     for (let i = 2; i <= 13; i++) {
  //       expect(result).toContain(`Point ${i}`)
  //     }

  //     expect(
  //       normalizeWhitespace(
  //         getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
  //       )
  //     ).toBe(EXPECTED_TEXT.coordinateSystems.wgs84)

  //     expect(result).toContain('54.720000, -1.600000')
  //     expect(result).toContain('54.744000, -1.576000')
  //   })

  //   test('Should display OSGB36 polygon coordinates correctly with 13 points', async () => {
  //     const largeOsgb36PolygonCoordinates = [
  //       { eastings: '425053', northings: '564180' },
  //       { eastings: '426000', northings: '565000' },
  //       { eastings: '427000', northings: '566000' },
  //       { eastings: '428000', northings: '567000' },
  //       { eastings: '429000', northings: '568000' },
  //       { eastings: '430000', northings: '569000' },
  //       { eastings: '431000', northings: '570000' },
  //       { eastings: '432000', northings: '571000' },
  //       { eastings: '433000', northings: '572000' },
  //       { eastings: '434000', northings: '573000' },
  //       { eastings: '435000', northings: '574000' },
  //       { eastings: '436000', northings: '575000' },
  //       { eastings: '437000', northings: '576000' }
  //     ]

  //     const largeOsgb36PolygonExemption = createPolygonExemption(
  //       'osgb36',
  //       largeOsgb36PolygonCoordinates
  //     )

  //     setupPolygonMocks(largeOsgb36PolygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)
  //     const { document } = new JSDOM(result).window

  //     expect(result).toContain('Start and end points')
  //     for (let i = 2; i <= 13; i++) {
  //       expect(result).toContain(`Point ${i}`)
  //     }

  //     expect(
  //       normalizeWhitespace(
  //         getSecondRowValue(document, CSS_SELECTORS.cards.siteDetails)
  //       )
  //     ).toBe(EXPECTED_TEXT.coordinateSystems.osgb36)

  //     // Check a couple of coordinates are there
  //     expect(result).toContain('425053, 564180')
  //     expect(result).toContain('437000, 576000')
  //   })

  //   test('Should handle polygon sites with isPolygonSite property set correctly', async () => {
  //     const polygonExemption = createPolygonExemption('wgs84', [
  //       { latitude: '54.721000', longitude: '-1.595000' },
  //       { latitude: '54.725000', longitude: '-1.590000' },
  //       { latitude: '54.729000', longitude: '-1.585000' }
  //     ])

  //     setupPolygonMocks(polygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)

  //     expect(result).toContain('Start and end points')
  //     expect(result).toContain('Point 2')
  //     expect(result).toContain('Point 3')

  //     expect(result).toContain(
  //       'Manually enter multiple sets of coordinates to mark the boundary of the site'
  //     )
  //   })

  //   test('Should generate correct site details data for polygon sites', async () => {
  //     const polygonExemption = createPolygonExemption('wgs84', [
  //       { latitude: '54.721000', longitude: '-1.595000' },
  //       { latitude: '54.725000', longitude: '-1.590000' },
  //       { latitude: '54.729000', longitude: '-1.585000' }
  //     ])

  //     setupPolygonMocks(polygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)
  //     const { document } = new JSDOM(result).window

  //     const siteDetailsScript = document.querySelector('#site-details-data')
  //     expect(siteDetailsScript).toBeTruthy()

  //     const siteDetailsData = JSON.parse(siteDetailsScript.textContent.trim())
  //     expect(siteDetailsData).toEqual({
  //       coordinatesType: 'coordinates',
  //       coordinateSystem: 'wgs84',
  //       coordinatesEntry: 'multiple',
  //       coordinates: [
  //         { latitude: '54.721000', longitude: '-1.595000' },
  //         { latitude: '54.725000', longitude: '-1.590000' },
  //         { latitude: '54.729000', longitude: '-1.585000' }
  //       ],
  //       circleWidth: '100'
  //     })
  //   })

  //   test('Should include Map view row for polygon sites', async () => {
  //     const polygonExemption = createPolygonExemption('wgs84', [
  //       { latitude: '54.721000', longitude: '-1.595000' },
  //       { latitude: '54.725000', longitude: '-1.590000' },
  //       { latitude: '54.729000', longitude: '-1.585000' }
  //     ])

  //     setupPolygonMocks(polygonExemption)

  //     const { result, statusCode } = await server.inject({
  //       method: 'GET',
  //       url: '/exemption/check-your-answers'
  //     })

  //     expect(statusCode).toBe(200)
  //     const { document } = new JSDOM(result).window

  //     const summaryRows = document.querySelectorAll(
  //       `${CSS_SELECTORS.cards.siteDetails} ${CSS_SELECTORS.summaryList.row}`
  //     )
  //     const rowKeys = Array.from(summaryRows).map((row) =>
  //       row.querySelector(CSS_SELECTORS.summaryList.key)?.textContent.trim()
  //     )

  //     expect(rowKeys).toContain('Map view')

  //     const mapViewRow = Array.from(summaryRows).find(
  //       (row) =>
  //         row
  //           .querySelector(CSS_SELECTORS.summaryList.key)
  //           ?.textContent.trim() === 'Map view'
  //     )
  //     expect(mapViewRow).toBeTruthy()

  //     const mapViewValue = mapViewRow.querySelector(
  //       CSS_SELECTORS.summaryList.value
  //     )
  //     expect(mapViewValue.innerHTML).toContain('app-site-details-map')
  //     expect(mapViewValue.innerHTML).toContain('data-module="site-details-map"')
  //   })
  // })
})
