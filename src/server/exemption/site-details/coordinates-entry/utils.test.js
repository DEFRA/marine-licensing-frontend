import { getCoordinatesEntryBackLink } from './utils.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('#getCoordinatesEntryBackLink', () => {
  test('should return correct route when multipleSitesEnabled is true', () => {
    const exemption = {
      multipleSiteDetails: { multipleSitesEnabled: true }
    }

    const result = getCoordinatesEntryBackLink(exemption)

    expect(result).toBe(routes.SITE_DETAILS_ACTIVITY_DATES)
  })

  test('should return activity dates route when multipleSitesEnabled is true and sameActivityDates is yes', () => {
    const exemption = {
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes'
      }
    }

    const result = getCoordinatesEntryBackLink(exemption)

    expect(result).toBe(`${routes.SITE_DETAILS_ACTIVITY_DATES}`)
  })

  test('should return correct route when multipleSitesEnabled is false', () => {
    const exemption = {
      multipleSiteDetails: { multipleSitesEnabled: false }
    }

    const result = getCoordinatesEntryBackLink(exemption)

    expect(result).toBe(routes.MULTIPLE_SITES_CHOICE)
  })

  test('should return correct route when multipleSiteDetails is undefined', () => {
    const exemption = {}

    const result = getCoordinatesEntryBackLink(exemption)

    expect(result).toBe(routes.MULTIPLE_SITES_CHOICE)
  })

  test('should return correct route when exemption is null', () => {
    const result = getCoordinatesEntryBackLink(null)

    expect(result).toBe(routes.MULTIPLE_SITES_CHOICE)
  })
})
