import { getSiteDetailsBySite } from '~/src/server/common/helpers/session-cache/site-details-utils.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { getSiteNumber } from '~/src/server/exemption/site-details/utils/site-number.js'

/**
 * Gets site data for the current page
 * @param { object } request - Request object
 * @returns { object } Object containing data for site specific pages
 */
export const setSiteData = (request) => {
  const exemption = getExemptionCache(request)

  const siteNumber = getSiteNumber(exemption, request)

  const siteIndex = siteNumber - 1

  return {
    queryParams: siteNumber === 1 ? '' : `?site=${siteNumber}`,
    siteNumber,
    siteIndex,
    siteDetails: getSiteDetailsBySite(exemption, siteIndex)
  }
}

/**
 * Uses setSiteData as a pre commit handler
 * @param { object } request - Request object
 * @param {object} h - Hapi response toolkit
 * @returns {object} Hapi response (continue)
 */
export const setSiteDataPreHandler = {
  method: (request, h) => {
    request.site = setSiteData(request)

    return h.continue
  }
}
