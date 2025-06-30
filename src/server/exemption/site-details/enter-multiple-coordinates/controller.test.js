import { jest } from '@jest/globals'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails,
  getCoordinateSystem
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from './controller.js'
import { multipleCoordinatesPageData } from './utils.js'
import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js', () => ({
  getExemptionCache: jest.fn(),
  updateExemptionSiteDetails: jest.fn(),
  getCoordinateSystem: jest.fn()
}))

jest.mock('@hapi/wreck', () => ({
  patch: jest.fn()
}))

jest.mock('~/src/config/config.js', () => ({
  config: {
    get: jest.fn()
  }
}))

// Test helpers to reduce duplication
const createMockRequest = (overrides = {}) => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  ...overrides
})

const createMockH = () => ({
  view: jest.fn().mockReturnThis(),
  takeover: jest.fn().mockReturnThis(),
  redirect: jest.fn()
})

const createExemption = (coordinateSystem, overrides = {}) => ({
  id: '507f1f77bcf86cd799439011',
  projectName: 'Test Project',
  siteDetails: {
    coordinateSystem,
    ...overrides
  }
})

const createCoordinates = (coordinateSystem, count = 2) => {
  const coords = []
  for (let i = 0; i < count; i++) {
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      coords.push({
        latitude: `55.${123456 + i}`,
        longitude: `-1.${234567 + i}`
      })
    } else {
      coords.push({
        eastings: `${425053 + i}`,
        northings: `${564180 + i}`
      })
    }
  }
  return coords
}

const createPayload = (coordinateSystem, coordinates) => {
  const payload = {}
  coordinates.forEach((coord, index) => {
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      payload[`coordinates[${index}][latitude]`] = coord.latitude || ''
      payload[`coordinates[${index}][longitude]`] = coord.longitude || ''
    } else {
      payload[`coordinates[${index}][eastings]`] = coord.eastings || ''
      payload[`coordinates[${index}][northings]`] = coord.northings || ''
    }
  })
  return payload
}

const setupMocks = (
  coordinateSystem = COORDINATE_SYSTEMS.WGS84,
  exemptionOverrides = {}
) => {
  const exemption = createExemption(coordinateSystem, exemptionOverrides)
  getExemptionCache.mockReturnValue(exemption)
  getCoordinateSystem.mockReturnValue({ coordinateSystem })
  Wreck.patch.mockResolvedValue({
    res: { statusCode: 200 },
    payload: { success: true }
  })
  config.get.mockReturnValue('http://localhost:3000')
  return exemption
}

const testCases = [
  { system: COORDINATE_SYSTEMS.WGS84, template: 'wgs84' },
  { system: COORDINATE_SYSTEMS.OSGB36, template: 'osgb36' }
]

describe('Multiple Coordinates Controller', () => {
  let mockRequest, mockH

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = createMockRequest()
    mockH = createMockH()
  })

  describe('multipleCoordinatesController', () => {
    testCases.forEach(({ system, template }) => {
      describe(`${system} coordinate system`, () => {
        it('should render template with empty payload when no coordinates in session', () => {
          setupMocks(system)

          multipleCoordinatesController.handler(mockRequest, mockH)

          const expectedCoordinate =
            system === COORDINATE_SYSTEMS.WGS84
              ? { latitude: '', longitude: '' }
              : { eastings: '', northings: '' }

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            {
              ...multipleCoordinatesPageData,
              projectName: 'Test Project',
              coordinates: [
                expectedCoordinate,
                expectedCoordinate,
                expectedCoordinate
              ],
              coordinateCount: 3,
              errors: {}
            }
          )
        })

        it('should render template with pre-populated coordinates', () => {
          const coordinates = createCoordinates(system, 2)
          setupMocks(system, { multipleCoordinates: { coordinates } })

          multipleCoordinatesController.handler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            {
              ...multipleCoordinatesPageData,
              projectName: 'Test Project',
              coordinates,
              coordinateCount: 3,
              errors: {}
            }
          )
        })

        it('should add new coordinate when action=add', () => {
          const exemption = setupMocks(system)
          mockRequest.query = { action: 'add' }

          // Mock session update to return updated exemption
          const expectedCoord =
            system === COORDINATE_SYSTEMS.WGS84
              ? { latitude: '', longitude: '' }
              : { eastings: '', northings: '' }

          const updatedExemption = {
            ...exemption,
            siteDetails: {
              ...exemption.siteDetails,
              multipleCoordinates: { coordinates: [expectedCoord] }
            }
          }

          getExemptionCache
            .mockReturnValueOnce(exemption) // First call returns original
            .mockReturnValueOnce(updatedExemption) // Second call returns updated

          multipleCoordinatesController.handler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            {
              ...multipleCoordinatesPageData,
              projectName: 'Test Project',
              coordinates: [expectedCoord],
              coordinateCount: 3,
              errors: {}
            }
          )
        })

        it('should remove coordinate when action=remove and valid index > 2', () => {
          const coordinates = createCoordinates(system, 5)
          const exemption = setupMocks(system, {
            multipleCoordinates: { coordinates }
          })
          mockRequest.query = { action: 'remove', pointIndex: '3' }

          // Create expected coordinates after removal (index 3 removed)
          const expectedCoordinates = [...coordinates]
          expectedCoordinates.splice(3, 1)

          const updatedExemption = {
            ...exemption,
            siteDetails: {
              ...exemption.siteDetails,
              multipleCoordinates: { coordinates: expectedCoordinates }
            }
          }

          getExemptionCache
            .mockReturnValueOnce(exemption) // First call returns original
            .mockReturnValueOnce(updatedExemption) // Second call returns updated

          multipleCoordinatesController.handler(mockRequest, mockH)

          const mockCall = mockH.view.mock.calls[0]
          const actualCoordinates = mockCall[1].coordinates

          expect(actualCoordinates).toHaveLength(4)

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.any(Array),
              coordinateCount: expect.any(Number),
              errors: expect.any(Object)
            })
          )
        })

        it('should handle form data from query parameters when JavaScript is disabled', () => {
          const exemption = setupMocks(system)

          // Simulate form data coming through query parameters (JavaScript disabled)
          const queryParams = {
            action: 'add',
            'coordinates[0][latitude]': '55.019889',
            'coordinates[0][longitude]': '-1.399500',
            'coordinates[1][latitude]': '55.020000',
            'coordinates[1][longitude]': '-1.400000',
            'coordinates[2][latitude]': '55.021000',
            'coordinates[2][longitude]': '-1.401000'
          }

          if (system === COORDINATE_SYSTEMS.OSGB36) {
            queryParams['coordinates[0][eastings]'] = '123456'
            queryParams['coordinates[0][northings]'] = '654321'
            queryParams['coordinates[1][eastings]'] = '123457'
            queryParams['coordinates[1][northings]'] = '654322'
            queryParams['coordinates[2][eastings]'] = '123458'
            queryParams['coordinates[2][northings]'] = '654323'

            delete queryParams['coordinates[0][latitude]']
            delete queryParams['coordinates[0][longitude]']
            delete queryParams['coordinates[1][latitude]']
            delete queryParams['coordinates[1][longitude]']
            delete queryParams['coordinates[2][latitude]']
            delete queryParams['coordinates[2][longitude]']
          }

          mockRequest.query = queryParams

          const updatedExemption = {
            ...exemption,
            siteDetails: {
              ...exemption.siteDetails,
              multipleCoordinates: {
                coordinates:
                  system === COORDINATE_SYSTEMS.WGS84
                    ? [
                        { latitude: '55.019889', longitude: '-1.399500' },
                        { latitude: '55.020000', longitude: '-1.400000' },
                        { latitude: '55.021000', longitude: '-1.401000' },
                        { latitude: '', longitude: '' }
                      ]
                    : [
                        { eastings: '123456', northings: '654321' },
                        { eastings: '123457', northings: '654322' },
                        { eastings: '123458', northings: '654323' },
                        { eastings: '', northings: '' }
                      ]
              }
            }
          }

          getExemptionCache
            .mockReturnValueOnce(exemption) // First call returns original
            .mockReturnValueOnce(updatedExemption) // Second call returns updated

          multipleCoordinatesController.handler(mockRequest, mockH)

          expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
            mockRequest,
            'multipleCoordinates',
            expect.objectContaining({
              coordinates: expect.arrayContaining([
                expect.any(Object),
                expect.any(Object),
                expect.any(Object),
                expect.any(Object)
              ])
            })
          )

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.any(Array),
              coordinateCount: expect.any(Number),
              errors: expect.any(Object)
            })
          )
        })
      })
    })
  })

  describe('multipleCoordinatesSubmitController', () => {
    testCases.forEach(({ system }) => {
      describe(`${system} coordinate system`, () => {
        it('should save valid coordinates and redirect to task list', async () => {
          setupMocks(system)
          const coordinates = createCoordinates(system, 3)
          mockRequest.payload = createPayload(system, coordinates)

          await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

          expect(Wreck.patch).toHaveBeenCalled()
          expect(mockH.redirect).toHaveBeenCalledWith('/exemption/task-list')
        })

        it('should process valid coordinates', async () => {
          setupMocks(system)
          const coordinates = createCoordinates(system, 3)
          mockRequest.payload = createPayload(system, coordinates)

          await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

          expect(Wreck.patch).toHaveBeenCalled()
          expect(mockH.redirect).toHaveBeenCalledWith('/exemption/task-list')
        })

        it('should handle API failure', async () => {
          setupMocks(system)
          Wreck.patch.mockRejectedValue(new Error('API Error'))
          const coordinates = createCoordinates(system, 3)
          mockRequest.payload = createPayload(system, coordinates)

          await expect(
            multipleCoordinatesSubmitController.handler(mockRequest, mockH)
          ).rejects.toThrow()
        })
      })
    })
  })
})
