import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/controller.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Multiple Coordinates Controller', () => {
  let getExemptionCacheSpy
  let getCoordinateSystemSpy
  let updateExemptionSiteDetailsSpy

  const mockCoordinatesArray = [
    { latitude: '55.123456', longitude: '-1.234567' },
    { latitude: '55.123457', longitude: '-1.234568' }
  ]

  const mockOsgb36CoordinatesArray = [
    { eastings: '425053', northings: '564180' },
    { eastings: '425054', northings: '564181' }
  ]

  beforeEach(() => {
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = jest
      .spyOn(cacheUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
    updateExemptionSiteDetailsSpy = jest.spyOn(
      cacheUtils,
      'updateExemptionSiteDetails'
    )
  })

  describe('multipleCoordinatesController', () => {
    ;[COORDINATE_SYSTEMS.WGS84, COORDINATE_SYSTEMS.OSGB36].forEach(
      (coordinateSystem) => {
        describe(`${coordinateSystem} coordinate system`, () => {
          beforeEach(() => {
            getCoordinateSystemSpy.mockReturnValue({ coordinateSystem })
          })

          test('should render template with empty payload when no coordinates in session', () => {
            getExemptionCacheSpy.mockReturnValue({
              projectName: 'Test Project'
            })

            const mockH = { view: jest.fn() }
            const template =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84 ? 'wgs84' : 'osgb36'

            multipleCoordinatesController.handler({}, mockH)

            const expectedPayload =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? {
                    'point1-latitude': '',
                    'point1-longitude': '',
                    'point2-latitude': '',
                    'point2-longitude': '',
                    'point3-latitude': '',
                    'point3-longitude': ''
                  }
                : {
                    'point1-eastings': '',
                    'point1-northings': '',
                    'point2-eastings': '',
                    'point2-northings': '',
                    'point3-eastings': '',
                    'point3-northings': ''
                  }

            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              {
                backLink: '/exemption/what-coordinate-system',
                heading:
                  'Enter multiple sets of coordinates to mark the boundary of the site',
                pageTitle: 'Enter multiple coordinates',
                payload: expectedPayload,
                projectName: 'Test Project'
              }
            )
          })

          test('should render template with pre-populated coordinates', () => {
            const coordinates =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? mockCoordinatesArray
                : mockOsgb36CoordinatesArray

            getExemptionCacheSpy.mockReturnValue({
              ...mockExemption,
              siteDetails: {
                multipleCoordinates: { coordinates }
              }
            })

            const mockH = { view: jest.fn() }
            const template =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84 ? 'wgs84' : 'osgb36'

            multipleCoordinatesController.handler({}, mockH)

            const expectedPayload =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? {
                    'point1-latitude': '55.123456',
                    'point1-longitude': '-1.234567',
                    'point2-latitude': '55.123457',
                    'point2-longitude': '-1.234568',
                    'point3-latitude': '',
                    'point3-longitude': ''
                  }
                : {
                    'point1-eastings': '425053',
                    'point1-northings': '564180',
                    'point2-eastings': '425054',
                    'point2-northings': '564181',
                    'point3-eastings': '',
                    'point3-northings': ''
                  }

            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              {
                backLink: '/exemption/what-coordinate-system',
                heading:
                  'Enter multiple sets of coordinates to mark the boundary of the site',
                pageTitle: 'Enter multiple coordinates',
                payload: expectedPayload,
                projectName: 'Test Project'
              }
            )
          })
        })
      }
    )
  })

  describe('multipleCoordinatesSubmitController', () => {
    ;[COORDINATE_SYSTEMS.WGS84, COORDINATE_SYSTEMS.OSGB36].forEach(
      (coordinateSystem) => {
        describe(`${coordinateSystem} coordinate system`, () => {
          beforeEach(() => {
            getCoordinateSystemSpy.mockReturnValue({ coordinateSystem })
          })

          test('should handle validation errors and stay on same page', () => {
            const invalidPayload =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? {
                    'point1-latitude': 'invalid',
                    'point1-longitude': '',
                    'point2-latitude': '',
                    'point2-longitude': '',
                    'point3-latitude': '',
                    'point3-longitude': ''
                  }
                : {
                    'point1-eastings': 'invalid',
                    'point1-northings': '',
                    'point2-eastings': '',
                    'point2-northings': '',
                    'point3-eastings': '',
                    'point3-northings': ''
                  }

            const mockRequest = { payload: invalidPayload }
            const mockH = { view: jest.fn() }
            const template =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84 ? 'wgs84' : 'osgb36'

            multipleCoordinatesSubmitController.handler(mockRequest, mockH)

            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              expect.objectContaining({
                payload: invalidPayload,
                errors: expect.any(Object),
                errorSummary: expect.any(Array)
              })
            )

            expect(updateExemptionSiteDetailsSpy).not.toHaveBeenCalled()
          })

          test('should process valid coordinates and stay on same page', () => {
            const validPayload =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84
                ? {
                    'point1-latitude': '55.123456',
                    'point1-longitude': '-1.234567',
                    'point2-latitude': '55.123457',
                    'point2-longitude': '-1.234568',
                    'point3-latitude': '55.123458',
                    'point3-longitude': '-1.234569'
                  }
                : {
                    'point1-eastings': '425053',
                    'point1-northings': '564180',
                    'point2-eastings': '425054',
                    'point2-northings': '564181',
                    'point3-eastings': '425055',
                    'point3-northings': '564182'
                  }

            const mockRequest = { payload: validPayload }
            const mockH = { view: jest.fn() }
            const template =
              coordinateSystem === COORDINATE_SYSTEMS.WGS84 ? 'wgs84' : 'osgb36'

            multipleCoordinatesSubmitController.handler(mockRequest, mockH)

            expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
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

            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              expect.objectContaining({
                payload: expect.any(Object)
              })
            )
          })
        })
      }
    )
  })
})
