import { vi } from 'vitest'
import {
  coordinatesEntryController,
  coordinatesEntrySubmitController,
  MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/coordinates-entry/controller.js'
import {
  getMarineLicenceCache,
  getSavedSiteDetails,
  setSavedSiteDetails,
  updateMarineLicenceSiteDetails,
  updateMarineLicenceSiteDetailsMultiple
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
    vi.mocked(getSavedSiteDetails).mockReturnValue({})
  })

  describe('#coordinatesEntryController', () => {
    test('handler should render with correct context', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single' }]
      })
      const h = { view: vi.fn() }

      coordinatesEntryController.handler(createMockRequest(), h)

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
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        projectName: mockMarineLicenceApplication.projectName,
        siteDetails: [{}]
      })
      const h = { view: vi.fn() }

      coordinatesEntryController.handler(createMockRequest(), h)

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
        payload: { coordinatesEntry: 'single' }
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
        payload: { coordinatesEntry: 'single' }
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

    test('should redirect to review page when action is set and answer is unchanged', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single' }]
      })
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { coordinatesEntry: 'single' },
        query: { action: 'change' }
      })

      await coordinatesEntrySubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
      )
      expect(setSavedSiteDetails).not.toHaveBeenCalled()
      expect(updateMarineLicenceSiteDetailsMultiple).not.toHaveBeenCalled()
    })

    test('should save original values, clear site data, and redirect when action is set and answer changes', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
      })
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { coordinatesEntry: 'multiple' },
        query: { action: 'change' }
      })

      await coordinatesEntrySubmitController.handler(request, h)

      expect(setSavedSiteDetails).toHaveBeenCalledWith(request, h, {
        originalCoordinatesEntry: 'single',
        originalCoordinateSystem: 'wgs84'
      })
      expect(updateMarineLicenceSiteDetailsMultiple).toHaveBeenCalledWith(
        request,
        h,
        0,
        { coordinateSystem: null, coordinates: null, circleWidth: null }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE}?site=1&action=change`
      )
    })

    test('should not overwrite originalCoordinatesEntry when already saved', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
      })
      vi.mocked(getSavedSiteDetails).mockReturnValue({
        originalCoordinatesEntry: 'single'
      })
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { coordinatesEntry: 'multiple' },
        query: { action: 'change' }
      })

      await coordinatesEntrySubmitController.handler(request, h)

      expect(setSavedSiteDetails).toHaveBeenCalledWith(request, h, {
        originalCoordinatesEntry: 'single',
        originalCoordinateSystem: 'wgs84'
      })
    })

    test('should not overwrite originalCoordinateSystem when already saved', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single', coordinateSystem: 'wgs84' }]
      })
      vi.mocked(getSavedSiteDetails).mockReturnValue({
        originalCoordinateSystem: 'osgb36'
      })
      const h = { redirect: vi.fn() }
      const request = createMockRequest({
        payload: { coordinatesEntry: 'multiple' },
        query: { action: 'change' }
      })

      await coordinatesEntrySubmitController.handler(request, h)

      expect(setSavedSiteDetails).toHaveBeenCalledWith(request, h, {
        originalCoordinatesEntry: 'single',
        originalCoordinateSystem: 'osgb36'
      })
    })
  })

  describe('#coordinatesEntryController action mode', () => {
    test('should use review page back link and no cancel link when action is set', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [{ coordinatesEntry: 'single' }]
      })
      const h = { view: vi.fn() }

      coordinatesEntryController.handler(
        createMockRequest({ query: { action: 'change' } }),
        h
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_ENTRY_VIEW_ROUTE,
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`,
          cancelLink: undefined,
          action: 'change'
        })
      )
    })
  })
})
