import { routes } from '#src/server/common/constants/routes.js'
import { getBackLink } from './utils.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'

describe('sameActivityDescription utils', () => {
  describe('getBackLink util', () => {
    test('getBackLink correctly returns in manual journey', () => {
      expect(
        getBackLink(mockExemption, {
          ...mockExemption.siteDetails[0],
          coordinatesType: 'coordinates'
        })
      ).toBe(routes.ACTIVITY_DATES)
    })

    test('getBackLink correctly returns in file journey with same dates selected', () => {
      expect(
        getBackLink(mockExemption, {
          ...mockExemption.siteDetails[0],
          coordinatesType: 'file'
        })
      ).toBe(routes.ACTIVITY_DATES)
    })

    test('getBackLink correctly returns in file journey with variable dates selected', () => {
      expect(
        getBackLink(
          {
            ...mockExemption,
            multipleSiteDetails: {
              ...mockExemption.multipleSiteDetails,
              sameActivityDates: 'no'
            }
          },
          { ...mockExemption.siteDetails[0], coordinatesType: 'file' }
        )
      ).toBe(routes.SAME_ACTIVITY_DATES)
    })

    test('getBackLink correctly returns when we have an action value', () => {
      expect(
        getBackLink(
          mockExemption,
          {
            ...mockExemption.siteDetails[0],
            coordinatesType: 'file'
          },
          'change'
        )
      ).toBe(routes.REVIEW_SITE_DETAILS)
    })
  })
})
