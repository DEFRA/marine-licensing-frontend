import { beforeAll, vi } from 'vitest'
import {
  siteNameController,
  siteNameSubmitController,
  SITE_NAME_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/site-name/controller.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

describe('#siteName', () => {
  const mockSiteName = 'Test Site Name'

  beforeAll(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#siteNameController', () => {
    test('should render with correct context', () => {
      const h = { view: vi.fn() }
      const request = createMockRequest()

      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            siteName: mockSiteName
          }
        ]
      })

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        payload: { siteName: mockSiteName },
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined
      })
    })

    test('should include action in view context when action parameter is present', () => {
      const h = { view: vi.fn() }
      const request = createMockRequest({ query: { action: 'add' } })

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          action: 'add'
        })
      )
    })
  })

  describe('#siteNameSubmitController', () => {
    test('should redirect to next page when valid site name is submitted', async () => {
      vi.mocked(updateMarineLicenceSiteDetails).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            siteName: mockSiteName
          }
        ]
      })

      const request = createMockRequest({
        payload: { siteName: 'Test Site Name' }
      })
      const h = { redirect: vi.fn() }

      await siteNameSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'siteName',
        'Test Site Name'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_SITE_NAME
      )
    })

    test('should handle validation failure with error details', () => {
      const request = createMockRequest({
        payload: { siteName: '' }
      })
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        payload: { siteName: '' },
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined,
        errors: expect.any(Object),
        errorSummary: expect.any(Array)
      })
    })

    test('should handle validation failure without error details', () => {
      const request = createMockRequest({
        payload: { siteName: 'invalid' }
      })
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      siteNameSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        payload: { siteName: 'invalid' },
        projectName: 'Test Project',
        siteNumber: 1,
        action: undefined
      })
    })

    test('should preserve action parameter in validation failure', () => {
      const request = createMockRequest({
        payload: { siteName: '' },
        query: { action: 'add' }
      })
      const h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          action: 'add',
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      )
    })
  })
})
