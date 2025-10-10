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
  test('correct back link for first site', () => {
    const result = getBackRoute(0)

    expect(result).toBe(routes.SAME_ACTIVITY_DATES)
  })

  test('correct back link for additional sites', () => {
    const result = getBackRoute(1, '?site=1')

    expect(result).toBe(`${routes.SITE_NAME}?site=1`)
  })
})
