import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import * as cacheUtils from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import * as exemptionService from '#src/services/exemption-service/index.js'
import {
  FILE_UPLOAD_REVIEW_VIEW_ROUTE,
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '#src/server/exemption/site-details/review-site-details/controller.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import { makePostRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/coordinate-utils.js')
vi.mock('~/src/services/exemption-service/index.js')

function createMockHandler(type = 'view') {
  if (type === 'redirect') {
    return { redirect: vi.fn() }
  }
  return { view: vi.fn() }
}
function createMockExemption(
  type = 'single',
  coordinateSystem = COORDINATE_SYSTEMS.WGS84,
  overrides = {}
) {
  const baseExemption = {
    ...mockExemption,
    ...overrides,
    siteDetails: [
      {
        ...mockExemption.siteDetails[0],
        coordinatesType: 'coordinates',
        coordinateSystem
      }
    ]
  }

  switch (type) {
    case 'multiple':
      return {
        ...baseExemption,
        siteDetails: [
          {
            ...baseExemption.siteDetails[0],
            coordinatesEntry: 'multiple',
            coordinates:
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? [
                    { latitude: '55.123456', longitude: '55.123456' },
                    { latitude: '33.987654', longitude: '33.987654' },
                    { latitude: '78.123456', longitude: '78.123456' }
                  ]
                : [
                    { eastings: '425053', northings: '564180' },
                    { eastings: '426000', northings: '565000' },
                    { eastings: '427000', northings: '566000' }
                  ]
          }
        ]
      }

    case 'file':
      return {
        ...baseExemption,
        siteDetails: [
          {
            coordinatesType: 'file',
            coordinateSystem,
            fileUploadType: 'kml',
            uploadedFile: {
              filename: 'test-site.kml'
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
        ]
      }

    case 'empty':
      return {
        id: baseExemption.id,
        projectName: baseExemption.projectName
        // siteDetails is undefined
      }

    default: // 'single'
      return {
        ...baseExemption,
        siteDetails: [
          {
            ...baseExemption.siteDetails[0],
            coordinatesEntry: 'single',
            coordinates:
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? {
                    latitude: mockExemption.siteDetails[0].coordinates.latitude,
                    longitude:
                      mockExemption.siteDetails[0].coordinates.longitude
                  }
                : { eastings: '425053', northings: '564180' },
            circleWidth: '100'
          }
        ]
      }
  }
}

describe('#reviewSiteDetails', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy
  let setExemptionCacheSpy
  let resetExemptionSiteDetailsSpy

  const createMockRequest = () => ({
    payload: {},
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    },
    yar: {
      clear: vi.fn(),
      flash: vi.fn()
    }
  })

  beforeEach(() => {
    // Mock ExemptionService
    const mockExemptionServiceInstance = {
      getExemptionById: vi.fn().mockResolvedValue(mockExemption)
    }
    vi.spyOn(exemptionService, 'getExemptionService').mockReturnValue(
      mockExemptionServiceInstance
    )

    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)

    setExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockResolvedValue(true)

    resetExemptionSiteDetailsSpy = vi
      .spyOn(cacheUtils, 'resetExemptionSiteDetails')
      .mockReturnValue({ siteDetails: null })
  })

  describe('Unit Tests', () => {
    describe('GET Handler', () => {
      test('should redirect to task list when no exemption ID exists', async () => {
        getExemptionCacheSpy.mockReturnValueOnce({})

        const h = createMockHandler('redirect')
        const mockRequest = createMockRequest()

        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(mockRequest.yar.flash).not.toHaveBeenCalled()

        expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
      })

      test('should load data from ExemptionService', async () => {
        const fileExemption = createMockExemption(
          'file',
          COORDINATE_SYSTEMS.WGS84,
          {
            id: 'test-id',
            projectName: 'Test Project'
          }
        )

        getExemptionCacheSpy.mockReturnValueOnce({ id: 'test-id' })

        // Mock the ExemptionService to return file exemption data
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(fileExemption)
        }
        vi.spyOn(exemptionService, 'getExemptionService').mockReturnValue(
          mockExemptionServiceInstance
        )

        const h = createMockHandler()
        const mockRequest = createMockRequest()
        await reviewSiteDetailsController.handler(mockRequest, h)

        expect(exemptionService.getExemptionService).toHaveBeenCalledWith(
          mockRequest
        )

        expect(setExemptionCacheSpy).toHaveBeenCalled()

        expect(
          mockExemptionServiceInstance.getExemptionById
        ).toHaveBeenCalledWith('test-id')
        expect(h.view).toHaveBeenCalledWith(
          FILE_UPLOAD_REVIEW_VIEW_ROUTE,
          expect.objectContaining({
            heading: 'Review site details',
            isMultiSiteJourney: false,
            pageTitle: 'Review site details',
            backLink: routes.FILE_UPLOAD,
            projectName: 'Test Project',
            summaryData: expect.arrayContaining([
              expect.objectContaining({
                coordinates: [
                  {
                    type: 'Point',
                    coordinates: [51.5074, -0.1278]
                  }
                ]
              })
            ]),
            multipleSiteDetailsData: expect.objectContaining({
              method: 'Upload a file with the coordinates of the site',
              fileType: 'KML',
              filename: 'test-site.kml'
            })
          })
        )
      })
    })
  })

  describe('POST Handler - Read-Only Flow', () => {
    test('should redirect to task list if no id is present', async () => {
      cacheUtils.getExemptionCache.mockReturnValue({})

      const { headers, statusCode } = await makePostRequest({
        url: routes.REVIEW_SITE_DETAILS,
        server: getServer(),
        headers: {
          referer: `http://localhost/${routes.WIDTH_OF_SITE}`
        }
      })

      expect(headers.location).toBe(routes.TASK_LIST)
      expect(statusCode).toBe(statusCodes.redirect)
    })

    test('should reset exemption and redirect to task list', async () => {
      const request = {
        payload: {},
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn()
        },
        yar: {
          flash: vi.fn().mockReturnValue([])
        }
      }
      getExemptionCacheSpy.mockReturnValue(mockExemption)
      const h = { redirect: vi.fn() }

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(resetExemptionSiteDetailsSpy).toHaveBeenCalledWith(request, h)
      expect(h.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    test('should redirect to check your answers when returnTo flash is set', async () => {
      const request = {
        payload: {},
        logger: {},
        yar: {
          flash: vi.fn().mockReturnValue([routes.CHECK_YOUR_ANSWERS])
        }
      }
      getExemptionCacheSpy.mockReturnValue(mockExemption)
      const h = { redirect: vi.fn() }

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(request.yar.flash).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
      expect(h.redirect).toHaveBeenCalledWith(routes.CHECK_YOUR_ANSWERS)
      expect(resetExemptionSiteDetailsSpy).not.toHaveBeenCalled()
    })

    test('should add another site correctly', async () => {
      const { headers, statusCode } = await makePostRequest({
        url: routes.REVIEW_SITE_DETAILS,
        server: getServer(),
        formData: { add: true }
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(`${routes.SITE_NAME}?site=3`)
    })
  })
})
