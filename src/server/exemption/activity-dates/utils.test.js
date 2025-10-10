import { getBackRoute, getNextRoute } from './utils.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('#getNextRoute', () => {
  describe('when not in site details flow', () => {
    test('should return correct route route regardless of exemption data', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false }
      }

      const result = getNextRoute(exemption, false)

      expect(result).toBe(routes.TASK_LIST)
    })
  })

  describe('when in site details flow', () => {
    test('should return correct route when multipleSitesEnabled is true', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: true }
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.SAME_ACTIVITY_DESCRIPTION)
    })

    test('should return correct route when multipleSitesEnabled is false', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false }
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })

    test('should return correct route when exemption is null', () => {
      const result = getNextRoute(null, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })
  })
})

describe('#getBackRoute', () => {
  test('correct back link for first site in multiple sites journey', () => {
    const exemption = {
      multipleSiteDetails: { multipleSitesEnabled: true },
      siteDetails: [{}]
    }

    const result = getBackRoute({ siteIndex: 0, queryParams: '' }, exemption)

    expect(result).toBe(routes.SAME_ACTIVITY_DATES)
  })

  test('correct back link for additional sites', () => {
    const result = getBackRoute({ siteIndex: 1, queryParams: '?site=1' })

    expect(result).toBe(`${routes.SITE_NAME}?site=1`)
  })

  test('should return FILE_UPLOAD for single site file upload', () => {
    const exemption = {
      multipleSiteDetails: { multipleSitesEnabled: false },
      siteDetails: [{ coordinatesType: 'file' }]
    }

    const result = getBackRoute({ siteIndex: 0, queryParams: '' }, exemption)

    expect(result).toBe(routes.FILE_UPLOAD)
  })

  test('should return SAME_ACTIVITY_DATES for multiple sites even with file upload', () => {
    const exemption = {
      multipleSiteDetails: { multipleSitesEnabled: true },
      siteDetails: [{ coordinatesType: 'file' }]
    }

    const result = getBackRoute({ siteIndex: 0, queryParams: '' }, exemption)

    expect(result).toBe(routes.SAME_ACTIVITY_DATES)
  })

  test('should return MULTIPLE_SITES_CHOICE when no exemption provided (defaults to single site)', () => {
    const result = getBackRoute({ siteIndex: 0, queryParams: '' }, null)

    expect(result).toBe(routes.MULTIPLE_SITES_CHOICE)
  })

  test('should return MULTIPLE_SITES_CHOICE for single site with manual coordinates', () => {
    const exemption = {
      multipleSiteDetails: { multipleSitesEnabled: false },
      siteDetails: [{ coordinatesType: 'coordinates' }]
    }

    const result = getBackRoute({ siteIndex: 0, queryParams: '' }, exemption)

    expect(result).toBe(routes.MULTIPLE_SITES_CHOICE)
  })
})
