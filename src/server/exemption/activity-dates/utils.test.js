import { getNextRoute } from './utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('#getNextRoute', () => {
  describe('when not in site details flow', () => {
    test('should return TASK_LIST route', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: true }
      }

      const result = getNextRoute(exemption, false)

      expect(result).toBe(routes.TASK_LIST)
    })

    test('should return TASK_LIST route regardless of exemption data', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false }
      }

      const result = getNextRoute(exemption, false)

      expect(result).toBe(routes.TASK_LIST)
    })

    test('should return TASK_LIST route when exemption is null', () => {
      const result = getNextRoute(null, false)

      expect(result).toBe(routes.TASK_LIST)
    })
  })

  describe('when in site details flow', () => {
    test('should return COORDINATES_ENTRY_CHOICE when multipleSitesEnabled is true', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: true }
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.COORDINATES_ENTRY_CHOICE)
    })

    test('should return SITE_DETAILS_ACTIVITY_DESCRIPTION when multipleSitesEnabled is false', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: false }
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })

    test('should return SITE_DETAILS_ACTIVITY_DESCRIPTION when multipleSiteDetails is undefined', () => {
      const exemption = {}

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })

    test('should return SITE_DETAILS_ACTIVITY_DESCRIPTION when exemption is null', () => {
      const result = getNextRoute(null, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })

    test('should return SITE_DETAILS_ACTIVITY_DESCRIPTION when multipleSiteDetails.multipleSitesEnabled is undefined', () => {
      const exemption = {
        multipleSiteDetails: {}
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })

    test('should handle truthy values for multipleSitesEnabled', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: 'yes' }
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.COORDINATES_ENTRY_CHOICE)
    })

    test('should handle falsy values for multipleSitesEnabled', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: 0 }
      }

      const result = getNextRoute(exemption, true)

      expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DESCRIPTION)
    })
  })
})
