import { vi } from 'vitest'
import {
  coordinateSystemController,
  coordinateSystemSubmitController,
  MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/coordinate-system/controller.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

describe('#coordinateSystem (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#coordinateSystemController', () => {
    test('handler should render with correct context', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinateSystem: 'wgs84', coordinatesEntry: 'single' }]
      })
      const h = { view: vi.fn() }

      coordinateSystemController.handler(createMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE,
        {
          pageTitle: 'Which coordinate system do you want to use?',
          heading: 'Which coordinate system do you want to use?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
          cancelLink,
          projectName: 'Test Project',
          siteNumber: 1,
          action: undefined,
          payload: {
            coordinateSystem: 'wgs84'
          }
        }
      )
    })

    test('handler should render with correct context when no existing cache data', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        projectName: mockMarineLicenceApplication.projectName,
        siteDetails: [{}]
      })
      const h = { view: vi.fn() }

      coordinateSystemController.handler(createMockRequest(), h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE,
        {
          pageTitle: 'Which coordinate system do you want to use?',
          heading: 'Which coordinate system do you want to use?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
          cancelLink,
          projectName: 'Test Project',
          siteNumber: 1,
          action: undefined,
          payload: {
            coordinateSystem: undefined
          }
        }
      )
    })
  })

  describe('#coordinateSystemSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'invalid' }
      })

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinateSystem'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE,
        {
          pageTitle: 'Which coordinate system do you want to use?',
          heading: 'Which coordinate system do you want to use?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
          cancelLink,
          projectName: 'Test Project',
          siteNumber: 1,
          action: undefined,
          payload: { coordinateSystem: 'invalid' },
          errorSummary: [
            {
              href: '#coordinateSystem',
              text: 'TEST',
              field: ['coordinateSystem']
            }
          ],
          errors: {
            coordinateSystem: {
              field: ['coordinateSystem'],
              href: '#coordinateSystem',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should output page with no error data in object', () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'invalid' }
      })

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATE_SYSTEM_VIEW_ROUTE,
        {
          pageTitle: 'Which coordinate system do you want to use?',
          heading: 'Which coordinate system do you want to use?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
          cancelLink,
          projectName: 'Test Project',
          siteNumber: 1,
          action: undefined,
          payload: { coordinateSystem: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly navigate to single coordinates when coordinatesEntry is single', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
      })
      const h = { redirect: vi.fn() }

      await coordinateSystemSubmitController.handler(
        createMockRequest({ payload: { coordinateSystem: 'wgs84' } }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
      )
    })

    test('Should correctly navigate to multiple coordinates when coordinatesEntry is multiple', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [
          { coordinatesEntry: 'multiple', coordinateSystem: 'wgs84' }
        ]
      })
      const h = { redirect: vi.fn() }

      await coordinateSystemSubmitController.handler(
        createMockRequest({ payload: { coordinateSystem: 'wgs84' } }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
      )
    })

    test('Should fall back to circle centre point when coordinatesEntry is not set', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinateSystem: 'wgs84' }]
      })
      const h = { redirect: vi.fn() }

      await coordinateSystemSubmitController.handler(
        createMockRequest({ payload: { coordinateSystem: 'wgs84' } }),
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
      )
    })

    test('Should correctly set the cache when submitting', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
      })
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }
      const request = createMockRequest({
        payload: { coordinateSystem: 'wgs84' }
      })

      await coordinateSystemSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinateSystem',
        'wgs84'
      )
    })
  })
})
