import { vi } from 'vitest'
import {
  coordinatesEntryController,
  coordinatesEntrySubmitController,
  MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/coordinates-entry/controller.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

describe('#coordinatesEntry (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue({
      ...mockMarineLicenceApplication,
      siteDetails: [{ coordinatesEntry: 'single' }]
    })
  })

  describe('#coordinatesEntryController', () => {
    test('handler should render with correct context', () => {
      const h = { view: vi.fn() }

      coordinatesEntryController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to enter the site coordinates?',
          heading: 'How do you want to enter the site coordinates?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
          cancelLink,
          projectName: 'Test Project',
          payload: {
            coordinatesEntry: 'single'
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

      coordinatesEntryController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to enter the site coordinates?',
          heading: 'How do you want to enter the site coordinates?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
          cancelLink,
          projectName: 'Test Project',
          payload: {
            coordinatesEntry: undefined
          }
        }
      )
    })
  })

  describe('#coordinatesEntrySubmitController', () => {
    test('should correctly format error data', () => {
      const request = {
        payload: { coordinatesEntry: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinatesEntry'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinatesEntrySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to enter the site coordinates?',
          heading: 'How do you want to enter the site coordinates?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
          cancelLink,
          projectName: 'Test Project',
          payload: { coordinatesEntry: 'invalid' },
          errorSummary: [
            {
              href: '#coordinatesEntry',
              text: 'TEST',
              field: ['coordinatesEntry']
            }
          ],
          errors: {
            coordinatesEntry: {
              field: ['coordinatesEntry'],
              href: '#coordinatesEntry',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should output page with no error data in object', () => {
      const request = {
        payload: { coordinatesEntry: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      coordinatesEntrySubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to enter the site coordinates?',
          heading: 'How do you want to enter the site coordinates?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
          cancelLink,
          projectName: 'Test Project',
          payload: { coordinatesEntry: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should correctly validate on valid data', () => {
      const payloadValidator =
        coordinatesEntrySubmitController.options.validate.payload

      expect(
        payloadValidator.validate({ coordinatesEntry: 'single' }).error
      ).toBeUndefined()
      expect(
        payloadValidator.validate({ coordinatesEntry: 'multiple' }).error
      ).toBeUndefined()
    })

    test('should correctly validate on empty data', () => {
      const payloadValidator =
        coordinatesEntrySubmitController.options.validate.payload

      const result = payloadValidator.validate({})

      expect(result.error.message).toBe('COORDINATES_ENTRY_REQUIRED')
    })

    test('should correctly validate on invalid data', () => {
      const payloadValidator =
        coordinatesEntrySubmitController.options.validate.payload

      const result = payloadValidator.validate({ coordinatesEntry: 'invalid' })

      expect(result.error.message).toBe('COORDINATES_ENTRY_REQUIRED')
    })

    test('should redirect to coordinate system choice on successful POST', async () => {
      const h = { redirect: vi.fn() }

      const request = { payload: { coordinatesEntry: 'single' } }

      await coordinatesEntrySubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinatesEntry',
        'single'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
      )
    })
  })
})
