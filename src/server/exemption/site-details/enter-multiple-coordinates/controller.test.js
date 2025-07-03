import { jest } from '@jest/globals'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getCoordinateSystem,
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from './controller.js'
import { multipleCoordinatesPageData } from './utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js', () => ({
  getExemptionCache: jest.fn(),
  updateExemptionSiteDetails: jest.fn(),
  getCoordinateSystem: jest.fn()
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

const createCoordinates = (coordinateSystem, count = 3) => {
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
          const coordinates = createCoordinates(system, 3)
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

        it('should handle validation errors', () => {
          setupMocks(system)

          multipleCoordinatesController.handler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.arrayContaining([
                expect.any(Object),
                expect.any(Object),
                expect.any(Object)
              ]),
              coordinateCount: 3,
              errors: expect.any(Object)
            })
          )
        })
      })
    })
  })

  describe('multipleCoordinatesSubmitController', () => {
    testCases.forEach(({ system, template }) => {
      describe(`${system} coordinate system`, () => {
        it('should save valid coordinates and remain on same page (AC6)', () => {
          setupMocks(system)
          const coordinates = createCoordinates(system, 3)
          mockRequest.payload = createPayload(system, coordinates)

          multipleCoordinatesSubmitController.handler(mockRequest, mockH)

          // Should save coordinates to session
          expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
            mockRequest,
            'multipleCoordinates',
            expect.objectContaining({
              coordinates: expect.arrayContaining([
                expect.any(Object),
                expect.any(Object),
                expect.any(Object)
              ])
            })
          )

          // Should render the same page again (AC6)
          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.any(Array),
              coordinateCount: 3,
              errors: expect.any(Object)
            })
          )
        })

        it('should handle validation errors and redisplay form', () => {
          setupMocks(system)
          // Invalid coordinates that would fail validation
          const invalidCoordinates = [
            system === COORDINATE_SYSTEMS.WGS84
              ? { latitude: '', longitude: '' }
              : { eastings: '', northings: '' }
          ]
          mockRequest.payload = createPayload(system, invalidCoordinates)

          multipleCoordinatesSubmitController.handler(mockRequest, mockH)

          // Should still render the same page with validation errors
          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.any(Array),
              coordinateCount: 3,
              errors: expect.any(Object)
            })
          )
        })
      })
    })
  })
})
