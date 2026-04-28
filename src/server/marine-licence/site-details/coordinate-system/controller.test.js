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
    vi.mocked(getMarineLicenceCache).mockReturnValue({
      ...mockMarineLicenceApplication,
      siteDetails: [{ coordinateSystem: 'wgs84' }]
    })
  })

  describe('#coordinateSystemController', () => {
    test('handler should render with correct context', () => {
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
          siteNumber: null,
          action: undefined,
          payload: {
            coordinateSystem: 'wgs84'
          }
        }
      )
    })

    test('handler should render with correct context when no existing cache data', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName,
        siteDetails: []
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
          siteNumber: null,
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
          siteNumber: null,
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
          siteNumber: null,
          action: undefined,
          payload: { coordinateSystem: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly navigate to self when POST is successful', async () => {
      const h = { redirect: vi.fn() }

      const request = createMockRequest({
        payload: { coordinateSystem: 'wgs84' }
      })

      await coordinateSystemSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
      )
    })

    test('Should correctly set the cache when submitting', async () => {
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
