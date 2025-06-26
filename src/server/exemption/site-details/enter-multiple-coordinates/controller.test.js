import { jest } from '@jest/globals'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails,
  getCoordinateSystem
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController,
  multipleCoordinatesSubmitFailHandler,
  multipleCoordinatesPageData
} from './controller.js'
import Wreck from '@hapi/wreck'
import { config } from '~/src/config/config.js'

// Mock the session cache utilities
jest.mock('~/src/server/common/helpers/session-cache/utils.js', () => ({
  getExemptionCache: jest.fn(),
  updateExemptionSiteDetails: jest.fn(),
  getCoordinateSystem: jest.fn()
}))

// Mock Wreck for API calls
jest.mock('@hapi/wreck', () => ({
  patch: jest.fn()
}))

// Mock config
jest.mock('~/src/config/config.js', () => ({
  config: {
    get: jest.fn()
  }
}))

const mockRequest = {
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}

const mockH = {
  view: jest.fn(),
  takeover: jest.fn(),
  redirect: jest.fn()
}

describe('Multiple Coordinates Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockH.view.mockReturnThis()
    mockH.takeover.mockReturnThis()

    // Default mock setup
    getExemptionCache.mockReturnValue({
      id: '507f1f77bcf86cd799439011',
      projectName: 'Test Project',
      siteDetails: {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      }
    })

    // Mock getCoordinateSystem to return WGS84 by default
    getCoordinateSystem.mockReturnValue({
      coordinateSystem: COORDINATE_SYSTEMS.WGS84
    })

    // Mock Wreck API calls
    Wreck.patch.mockResolvedValue({
      res: { statusCode: 200 },
      payload: { success: true }
    })

    // Mock config
    config.get.mockReturnValue({
      apiUrl: 'http://localhost:3000'
    })
  })

  describe('multipleCoordinatesController', () => {
    it('should render WGS84 template with empty payload when no coordinates in session', () => {
      multipleCoordinatesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' }
            ]
          }
        }
      )
    })

    it('should render OSGB36 template with empty payload when no coordinates in session', () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36
        }
      })

      getCoordinateSystem.mockReturnValue({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      multipleCoordinatesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/osgb36',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { eastings: '', northings: '' },
              { eastings: '', northings: '' },
              { eastings: '', northings: '' }
            ]
          }
        }
      )
    })

    it('should render WGS84 template with pre-populated payload from session', () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          multipleCoordinates: {
            coordinates: [
              { latitude: '55.123456', longitude: '-1.234567' },
              { latitude: '55.654321', longitude: '-1.765432' }
            ]
          }
        }
      })

      multipleCoordinatesController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { latitude: '55.123456', longitude: '-1.234567' },
              { latitude: '55.654321', longitude: '-1.765432' }
            ]
          }
        }
      )
    })

    it('should add a new WGS84 coordinate point when action is add', () => {
      const requestWithQuery = {
        ...mockRequest,
        query: { action: 'add' }
      }

      multipleCoordinatesController.handler(requestWithQuery, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' }
            ]
          }
        }
      )
    })

    it('should add a new OSGB36 coordinate point when action is add', () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36
        }
      })

      getCoordinateSystem.mockReturnValue({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      const requestWithQuery = {
        ...mockRequest,
        query: { action: 'add' }
      }

      multipleCoordinatesController.handler(requestWithQuery, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/osgb36',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { eastings: '', northings: '' },
              { eastings: '', northings: '' },
              { eastings: '', northings: '' },
              { eastings: '', northings: '' }
            ]
          }
        }
      )
    })

    it('should remove a coordinate point when action is remove and index > 2', () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          multipleCoordinates: {
            coordinates: [
              { latitude: '55.019889', longitude: '-1.399500' },
              { latitude: '55.020000', longitude: '-1.400000' },
              { latitude: '55.021000', longitude: '-1.401000' },
              { latitude: '55.022000', longitude: '-1.402000' }
            ]
          }
        }
      })

      const requestWithQuery = {
        ...mockRequest,
        query: { action: 'remove', pointIndex: '3' }
      }

      multipleCoordinatesController.handler(requestWithQuery, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { latitude: '55.019889', longitude: '-1.399500' },
              { latitude: '55.020000', longitude: '-1.400000' },
              { latitude: '55.021000', longitude: '-1.401000' }
            ]
          }
        }
      )
    })

    it('should not remove coordinate point when index <= 2', () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          multipleCoordinates: {
            coordinates: [
              { latitude: '55.019889', longitude: '-1.399500' },
              { latitude: '55.020000', longitude: '-1.400000' },
              { latitude: '55.021000', longitude: '-1.401000' },
              { latitude: '55.022000', longitude: '-1.402000' }
            ]
          }
        }
      })

      const requestWithQuery = {
        ...mockRequest,
        query: { action: 'remove', pointIndex: '1' }
      }

      multipleCoordinatesController.handler(requestWithQuery, mockH)

      // Should still have 4 coordinates (no removal)
      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { latitude: '55.019889', longitude: '-1.399500' },
              { latitude: '55.020000', longitude: '-1.400000' },
              { latitude: '55.021000', longitude: '-1.401000' },
              { latitude: '55.022000', longitude: '-1.402000' }
            ]
          }
        }
      )
    })

    it('should not remove coordinate point when only 3 coordinates exist', () => {
      const requestWithQuery = {
        ...mockRequest,
        query: { action: 'remove', pointIndex: '2' }
      }

      multipleCoordinatesController.handler(requestWithQuery, mockH)

      // Should still have 3 coordinates (minimum required)
      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        {
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: {
            coordinates: [
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' },
              { latitude: '', longitude: '' }
            ]
          }
        }
      )
    })
  })

  describe('multipleCoordinatesSubmitController', () => {
    it('should save valid WGS84 coordinates and redirect to task list', async () => {
      const validPayload = {
        'coordinates[0][latitude]': '55.123456',
        'coordinates[0][longitude]': '-1.234567',
        'coordinates[1][latitude]': '55.654321',
        'coordinates[1][longitude]': '-1.765432',
        'coordinates[2][latitude]': '55.987654',
        'coordinates[2][longitude]': '-1.987654'
      }

      mockRequest.payload = validPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'multipleCoordinates',
        { coordinates: expect.any(Array) }
      )

      expect(Wreck.patch).toHaveBeenCalledWith(
        expect.stringContaining('/exemption/multiple-coordinates'),
        expect.objectContaining({
          payload: expect.objectContaining({
            id: '507f1f77bcf86cd799439011',
            coordinateSystem: 'wgs84',
            coordinates: expect.any(Array)
          }),
          json: true
        })
      )

      expect(mockH.redirect).toHaveBeenCalledWith('/exemption/task-list')
    })

    it('should return validation errors for invalid WGS84 coordinates', async () => {
      const invalidPayload = {
        'coordinates[0][latitude]': 'invalid',
        'coordinates[0][longitude]': '',
        'coordinates[1][latitude]': '55.123456',
        'coordinates[1][longitude]': '-1.234567',
        'coordinates[2][latitude]': '55.987654',
        'coordinates[2][longitude]': '-1.987654'
      }

      mockRequest.payload = invalidPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: expect.objectContaining({
            coordinates: expect.any(Array)
          }),
          errors: expect.any(Object),
          errorSummary: expect.any(Array)
        })
      )
    })

    it('should save valid OSGB36 coordinates and redirect to task list', async () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36
        }
      })

      getCoordinateSystem.mockReturnValue({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      const validPayload = {
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      mockRequest.payload = validPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'multipleCoordinates',
        { coordinates: expect.any(Array) }
      )

      expect(Wreck.patch).toHaveBeenCalledWith(
        expect.stringContaining('/exemption/multiple-coordinates'),
        expect.objectContaining({
          payload: expect.objectContaining({
            id: '507f1f77bcf86cd799439011',
            coordinateSystem: 'osgb36',
            coordinates: expect.any(Array)
          }),
          json: true
        })
      )

      expect(mockH.redirect).toHaveBeenCalledWith('/exemption/task-list')
    })

    it('should return validation errors for invalid OSGB36 coordinates', async () => {
      getExemptionCache.mockReturnValue({
        id: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        siteDetails: {
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36
        }
      })

      getCoordinateSystem.mockReturnValue({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      const invalidPayload = {
        'coordinates[0][eastings]': 'invalid',
        'coordinates[0][northings]': '',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      mockRequest.payload = invalidPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/osgb36',
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: expect.objectContaining({
            coordinates: expect.any(Array)
          }),
          errors: expect.any(Object),
          errorSummary: expect.any(Array)
        })
      )
    })
  })

  describe('multipleCoordinatesSubmitFailHandler', () => {
    it('should render WGS84 template with errors', () => {
      const error = {
        details: [
          {
            path: ['coordinates[0][latitude]'],
            message: 'Enter the latitude of the start and end point'
          }
        ]
      }

      multipleCoordinatesSubmitFailHandler(
        {
          ...mockRequest,
          payload: {
            'coordinates[0][latitude]': '',
            'coordinates[0][longitude]': '',
            'coordinates[1][latitude]': '',
            'coordinates[1][longitude]': '',
            'coordinates[2][latitude]': '',
            'coordinates[2][longitude]': ''
          }
        },
        mockH,
        error,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        expect.objectContaining({
          errors: expect.objectContaining({
            coordinates0latitude: {
              text: 'Enter the latitude of the start and end point'
            }
          }),
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              text: 'Enter the latitude of the start and end point'
            })
          ])
        })
      )
    })

    it('should handle error without details', () => {
      const error = {}

      multipleCoordinatesSubmitFailHandler(
        { ...mockRequest, payload: {} },
        mockH,
        error,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/enter-multiple-coordinates/wgs84',
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          projectName: 'Test Project',
          payload: expect.objectContaining({
            coordinates: expect.any(Array)
          })
        })
      )
    })
  })

  describe('Dynamic Error Messages', () => {
    it('should generate correct error messages for start and end point', async () => {
      const invalidPayload = {
        'coordinates[0][latitude]': '',
        'coordinates[0][longitude]': '',
        'coordinates[1][latitude]': '55.123456',
        'coordinates[1][longitude]': '-1.234567',
        'coordinates[2][latitude]': '55.987654',
        'coordinates[2][longitude]': '-1.987654'
      }

      mockRequest.payload = invalidPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      const viewData = call[1]

      expect(viewData.errorSummary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('start and end point')
          })
        ])
      )
    })

    it('should generate correct error messages for point 2', async () => {
      const invalidPayload = {
        'coordinates[0][latitude]': '55.123456',
        'coordinates[0][longitude]': '-1.234567',
        'coordinates[1][latitude]': '',
        'coordinates[1][longitude]': '',
        'coordinates[2][latitude]': '55.987654',
        'coordinates[2][longitude]': '-1.987654'
      }

      mockRequest.payload = invalidPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      const viewData = call[1]

      expect(viewData.errorSummary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('point 2')
          })
        ])
      )
    })

    it('should generate correct error messages for point 3', async () => {
      const invalidPayload = {
        'coordinates[0][latitude]': '55.123456',
        'coordinates[0][longitude]': '-1.234567',
        'coordinates[1][latitude]': '55.654321',
        'coordinates[1][longitude]': '-1.765432',
        'coordinates[2][latitude]': '',
        'coordinates[2][longitude]': ''
      }

      mockRequest.payload = invalidPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      const viewData = call[1]

      expect(viewData.errorSummary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('point 3')
          })
        ])
      )
    })

    it('should generate correct error messages for dynamically added point 4', async () => {
      const invalidPayload = {
        'coordinates[0][latitude]': '55.123456',
        'coordinates[0][longitude]': '-1.234567',
        'coordinates[1][latitude]': '55.654321',
        'coordinates[1][longitude]': '-1.765432',
        'coordinates[2][latitude]': '55.987654',
        'coordinates[2][longitude]': '-1.987654',
        'coordinates[3][latitude]': '',
        'coordinates[3][longitude]': ''
      }

      mockRequest.payload = invalidPayload

      await multipleCoordinatesSubmitController.handler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      const viewData = call[1]

      expect(viewData.errorSummary).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('point 4')
          })
        ])
      )
    })
  })
})
