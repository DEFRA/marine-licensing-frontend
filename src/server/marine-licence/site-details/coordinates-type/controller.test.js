import { vi } from 'vitest'
import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/coordinates-type/controller.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

describe('#coordinatesType (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#coordinatesTypeController', () => {
    test('handler should render with correct context', () => {
      const h = { view: vi.fn() }

      coordinatesTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
          cancelLink,
          projectName: 'Test Project',
          payload: {}
        }
      )
    })
  })

  describe('#coordinatesTypeSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { coordinatesType: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinatesType'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinatesTypeSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          projectName: 'Test Project',
          payload: { coordinatesType: 'invalid' },
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
          cancelLink,
          errorSummary: [
            {
              href: '#coordinatesType',
              text: 'TEST',
              field: ['coordinatesType']
            }
          ],
          errors: {
            coordinatesType: {
              field: ['coordinatesType'],
              href: '#coordinatesType',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object', () => {
      const request = {
        payload: { coordinatesType: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      coordinatesTypeSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
          cancelLink,
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          projectName: 'Test Project',
          payload: { coordinatesType: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })
  })
})
