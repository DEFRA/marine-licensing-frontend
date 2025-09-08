import { getBackLink } from './utils.js'
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
    test('should return correct route when multipleSitesEnabled is true', () => {
      const exemption = {
        multipleSiteDetails: { multipleSitesEnabled: true }
      }

      const result = getBackLink(exemption, true)

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
