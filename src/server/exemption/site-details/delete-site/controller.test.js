import {
  deleteSiteController,
  deleteSiteSubmitController
} from './controller.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { setSiteDataPreHandler } from '~/src/server/common/helpers/session-cache/site-utils.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/session-cache/site-utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

const mockH = {
  view: jest.fn(),
  redirect: jest.fn()
}

const mockRequest = {
  site: {
    siteNumber: '1',
    siteIndex: 0
  },
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}

const mockExemption = {
  id: 'test-exemption-id',
  projectName: 'Test Project',
  multipleSiteDetails: { multipleSitesEnabled: true },
  siteDetails: [
    {
      siteName: 'Test Site 1',
      coordinatesType: 'manual'
    },
    {
      siteName: 'Test Site 2',
      coordinatesType: 'manual'
    }
  ]
}

describe('deleteSiteController', () => {
  beforeEach(() => {
    getExemptionCache.mockReturnValue(mockExemption)
  })

  describe('deleteSiteController.handler', () => {
    it('should render delete site view with correct data', () => {
      deleteSiteController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'exemption/site-details/delete-site/index',
        {
          pageTitle: 'Are you sure you want to delete this site?',
          heading: 'Are you sure you want to delete this site?',
          siteNumber: '1',
          backLink: routes.REVIEW_SITE_DETAILS,
          routes
        }
      )
    })

    it('should have setSiteDataPreHandler in options', () => {
      expect(deleteSiteController.options.pre).toContain(setSiteDataPreHandler)
    })
  })

  describe('deleteSiteSubmitController.handler', () => {
    beforeEach(() => {
      authenticatedPatchRequest.mockResolvedValue({
        payload: { success: true }
      })
    })

    it('should make authenticated patch request with site removed and redirect', async () => {
      await deleteSiteSubmitController.handler(mockRequest, mockH)

      const expectedSiteDetails = [
        {
          siteName: 'Test Site 2',
          coordinatesType: 'manual'
        }
      ]

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: mockExemption.multipleSiteDetails,
          siteDetails: expectedSiteDetails,
          id: mockExemption.id
        }
      )

      expect(setExemptionCache).toHaveBeenCalledWith(mockRequest, {
        ...mockExemption,
        siteDetails: expectedSiteDetails
      })

      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        { siteNumber: '1', exemptionId: 'test-exemption-id' },
        'Deleted site 1'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    it('should handle deleting the second site correctly', async () => {
      const requestDeleteSecondSite = {
        ...mockRequest,
        site: {
          siteNumber: '2',
          siteIndex: 1
        }
      }

      await deleteSiteSubmitController.handler(requestDeleteSecondSite, mockH)

      const expectedSiteDetails = [
        {
          siteName: 'Test Site 1',
          coordinatesType: 'manual'
        }
      ]

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        requestDeleteSecondSite,
        '/exemption/site-details',
        {
          multipleSiteDetails: mockExemption.multipleSiteDetails,
          siteDetails: expectedSiteDetails,
          id: mockExemption.id
        }
      )

      expect(setExemptionCache).toHaveBeenCalledWith(requestDeleteSecondSite, {
        ...mockExemption,
        siteDetails: expectedSiteDetails
      })
    })

    it('should redirect to task list when deleting the last site', async () => {
      const exemptionWithOneSite = {
        ...mockExemption,
        siteDetails: [
          {
            siteName: 'Last Site',
            coordinatesType: 'manual'
          }
        ]
      }
      getExemptionCache.mockReturnValue(exemptionWithOneSite)

      await deleteSiteSubmitController.handler(mockRequest, mockH)

      expect(authenticatedPatchRequest).toHaveBeenCalledWith(
        mockRequest,
        '/exemption/site-details',
        {
          multipleSiteDetails: exemptionWithOneSite.multipleSiteDetails,
          siteDetails: [],
          id: exemptionWithOneSite.id
        }
      )

      expect(setExemptionCache).toHaveBeenCalledWith(mockRequest, {
        ...exemptionWithOneSite,
        siteDetails: []
      })

      // Should redirect to task list instead of review site details
      expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
    })

    it('should have setSiteDataPreHandler in options', () => {
      expect(deleteSiteSubmitController.options.pre).toContain(
        setSiteDataPreHandler
      )
    })
  })
})
