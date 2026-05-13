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
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

describe('#coordinatesEntry (marine licence)', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#coordinatesEntryController', () => {
    test('handler should render with correct context', () => {
      const h = { view: vi.fn() }

      coordinatesEntryController.handler(
        createMockRequest({
          site: {
            siteIndex: 0,
            siteNumber: 1,
            queryParams: '',
            siteDetails: { coordinatesEntry: 'single' }
          }
        }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to enter the site coordinates?',
          heading: 'How do you want to enter the site coordinates?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
          cancelLink,
          projectName: 'Test Project',
          siteNumber: 1,
          action: undefined,
          payload: {
            coordinatesEntry: 'single'
          }
        }
      )
    })

    test('handler should render with correct context when no existing cache data', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        projectName: mockMarineLicenceApplication.projectName
      })

      const h = { view: vi.fn() }

      coordinatesEntryController.handler(
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
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to enter the site coordinates?',
          heading: 'How do you want to enter the site coordinates?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
          cancelLink,
          projectName: 'Test Project',
          siteNumber: 1,
          action: undefined,
          payload: {
            coordinatesEntry: undefined
          }
        }
      )
    })
  })

  describe('#coordinatesEntrySubmitController', () => {
    test('Should correctly format error data', () => {
      const request = createMockRequest({
        payload: { coordinatesEntry: 'invalid' }
      })

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
          siteNumber: 1,
          action: undefined,
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

    test('Should output page with no error data in object', () => {
      const request = createMockRequest({
        payload: { coordinatesEntry: 'invalid' }
      })

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
          siteNumber: 1,
          action: undefined,
          payload: { coordinatesEntry: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly navigate to next page when POST is successful', async () => {
      const h = { redirect: vi.fn() }

      const request = createMockRequest({
        payload: { coordinatesEntry: 'single' },
        site: { siteIndex: 0, siteNumber: 1, queryParams: '', siteDetails: {} }
      })

      await coordinatesEntrySubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
      )
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
        view: vi.fn()
      }

      const request = createMockRequest({
        payload: { coordinatesEntry: 'single' },
        site: { siteIndex: 0, siteNumber: 1, queryParams: '', siteDetails: {} }
      })

      await coordinatesEntrySubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinatesEntry',
        'single'
      )
    })
  })
})
