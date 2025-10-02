import { getBackLink, getNextRoute } from './utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('#getBackLink', () => {
  describe('when not in site details flow', () => {
    test('should return correct route route regardless of exemption data', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false }
      }

      const result = getBackLink(exemption, false)

      expect(result).toBe(routes.TASK_LIST)
    })
  })

  describe('when in site details flow', () => {
    describe('single site journey', () => {
      test('should return correct route when multipleSitesEnabled is true', () => {
        const exemption = {
          multipleSiteDetails: { multipleSitesEnabled: true }
        }

        const result = getBackLink(exemption, true)

        expect(result).toBe(routes.SAME_ACTIVITY_DESCRIPTION)
      })
    })

    describe('multi site journey', () => {
      test('should return correct route on a second site with the same activity description', () => {
        const exemption = {
          multipleSiteDetails: {
            multipleSitesEnabled: true,
            sameActivityDescription: 'yes'
          }
        }

        const result = getBackLink(exemption, true, 1, '?site=1')

        expect(result).toBe(`${routes.SAME_ACTIVITY_DATES}?site=1`)
      })

      test('should return correct route on a second site with variable activity description', () => {
        const exemption = {
          multipleSiteDetails: {
            multipleSitesEnabled: true,
            sameActivityDescription: 'no'
          }
        }

        const result = getBackLink(exemption, true, 1)

        expect(result).toBe(routes.SAME_ACTIVITY_DESCRIPTION)
      })

      test('should return correct route on a first site', () => {
        const exemption = {
          multipleSiteDetails: {
            multipleSitesEnabled: true
          }
        }

        const result = getBackLink(exemption, true, 0)

        expect(result).toBe(routes.SAME_ACTIVITY_DESCRIPTION)
      })

      test('should return correct route when multipleSitesEnabled is false', () => {
        const exemption = {
          multipleSiteDetails: { multipleSitesEnabled: false }
        }

        const result = getBackLink(exemption, true)

        expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DATES)
      })

      test('should return correct route when exemption is null', () => {
        const result = getBackLink(null, true)

        expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DATES)
      })
    })
  })
})

describe('#getNextRoute', () => {
  test('should return correct route when not in site details', () => {
    const result = getNextRoute(false)
    expect(result).toBe(routes.TASK_LIST, {})
  })

  test('should return correct route for file journey', () => {
    const result = getNextRoute(true, {
      siteDetails: { coordinatesType: 'file' },
      queryParams: {}
    })
    expect(result).toBe(routes.REVIEW_SITE_DETAILS)
  })

  test('should return correct route for manual journey', () => {
    const result = getNextRoute(true, {
      siteDetails: { coordinatesType: 'coordinates' },
      queryParams: '&site=1'
    })
    expect(result).toBe(routes.COORDINATES_ENTRY_CHOICE + '&site=1')
  })
})
