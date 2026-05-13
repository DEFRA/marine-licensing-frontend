import { vi } from 'vitest'
import {
  centreCoordinatesController,
  centreCoordinatesSubmitController,
  centreCoordinatesSubmitFailHandler
} from '#src/server/marine-licence/site-details/centre-coordinates/controller.js'
import { COORDINATE_SYSTEM_VIEW_ROUTES } from '#src/server/common/validation/centre-coordinates/constants.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

const wgs84Coordinates = { latitude: '55.019889', longitude: '-1.399500' }
const osgb36Coordinates = { eastings: '425053', northings: '564180' }

describe('#centreCoordinates (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#centreCoordinatesController', () => {
    test('handler should render with correct context with no existing data', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName
      })
      const h = { view: vi.fn() }

      centreCoordinatesController.handler(
        createMockRequest({
          site: {
            siteIndex: 0,
            siteNumber: 1,
            queryParams: '',
            siteDetails: {}
          }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { latitude: undefined, longitude: undefined },
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('handler should render with correct context for wgs84', () => {
      const h = { view: vi.fn() }

      centreCoordinatesController.handler(
        createMockRequest({
          site: {
            siteIndex: 0,
            siteNumber: 1,
            queryParams: '',
            siteDetails: {
              coordinatesType: 'coordinates',
              coordinateSystem: COORDINATE_SYSTEMS.WGS84,
              coordinates: wgs84Coordinates
            }
          }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...wgs84Coordinates },
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('handler should render with correct context for osgb36', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName
      })
      const h = { view: vi.fn() }

      centreCoordinatesController.handler(
        createMockRequest({
          site: {
            siteIndex: 0,
            siteNumber: 1,
            queryParams: '',
            siteDetails: {
              coordinatesType: 'coordinates',
              coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
              coordinates: osgb36Coordinates
            }
          }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...osgb36Coordinates },
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })
  })

  describe('#centreCoordinatesSubmitFailHandler', () => {
    test('should correctly format error data', () => {
      const request = createMockRequest({
        query: {},
        payload: { latitude: 'invalid' },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.WGS84 }
        }
      })
      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }
      const err = {
        details: [{ path: ['latitude'], message: 'TEST', type: 'any.only' }]
      }

      centreCoordinatesSubmitFailHandler(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          payload: { latitude: 'invalid' },
          siteNumber: 1,
          errorSummary: [
            { href: '#latitude', text: 'TEST', field: ['latitude'] }
          ],
          errors: {
            latitude: { field: ['latitude'], href: '#latitude', text: 'TEST' }
          }
        }
      )
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should correctly format error data for osgb36', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName
      })
      const request = createMockRequest({
        query: {},
        payload: { eastings: 'invalid' },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.OSGB36 }
        }
      })
      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }
      const err = {
        details: [{ path: ['eastings'], message: 'TEST', type: 'any.only' }]
      }

      centreCoordinatesSubmitFailHandler(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          payload: { eastings: 'invalid' },
          siteNumber: 1,
          errorSummary: [
            { href: '#eastings', text: 'TEST', field: ['eastings'] }
          ],
          errors: {
            eastings: { field: ['eastings'], href: '#eastings', text: 'TEST' }
          }
        }
      )
      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should still render page if no error details are provided', () => {
      const request = createMockRequest({
        query: {},
        payload: { latitude: 'invalid' },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.WGS84 }
        }
      })
      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }

      centreCoordinatesSubmitFailHandler(request, h, {})

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          payload: { latitude: 'invalid' },
          siteNumber: 1
        }
      )
      expect(h.view().takeover).toHaveBeenCalled()
    })
  })

  describe('#centreCoordinatesSubmitController', () => {
    test('should correctly set the cache when submitting wgs84 data', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { ...wgs84Coordinates },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.WGS84 }
        }
      })

      await centreCoordinatesSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        wgs84Coordinates
      )
    })

    test('should trim spaces from wgs84 data and save the converted values', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { latitude: ' 55.019889', longitude: '-1.399500 ' },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.WGS84 }
        }
      })

      await centreCoordinatesSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        { latitude: '55.019889', longitude: '-1.399500' }
      )
    })

    test('should correctly set the cache when submitting OSGB36 data', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { ...osgb36Coordinates },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.OSGB36 }
        }
      })

      await centreCoordinatesSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        osgb36Coordinates
      )
    })

    test('should trim spaces from OSGB36 data and save the converted values', async () => {
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { eastings: ' 425053', northings: '564180 ' },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.OSGB36 }
        }
      })

      await centreCoordinatesSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        { eastings: '425053', northings: '564180' }
      )
    })

    test('should correctly handle validation errors', async () => {
      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }
      const request = createMockRequest({
        payload: { latitude: 'invalid' },
        site: {
          siteIndex: 0,
          siteNumber: 1,
          queryParams: '',
          siteDetails: { coordinateSystem: COORDINATE_SYSTEMS.WGS84 }
        }
      })

      await centreCoordinatesSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({ payload: { latitude: 'invalid' } })
      )
      expect(h.view().takeover).toHaveBeenCalled()
      expect(updateMarineLicenceSiteDetails).not.toHaveBeenCalled()
    })
  })
})
