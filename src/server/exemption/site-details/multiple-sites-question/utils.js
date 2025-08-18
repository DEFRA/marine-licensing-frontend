/**
 * Converts the multipleSitesEnabled boolean value from the exemption cache to a string value
 * for form display purposes
 * @param {object} multipleSiteDetails - The multipleSiteDetails object from exemption cache
 * @returns {string|undefined} - 'yes' if true, 'no' if false, undefined if not set
 */
export const getMultipleSitesEnabledValue = (multipleSiteDetails) => {
  if (multipleSiteDetails?.multipleSitesEnabled === undefined) {
    return undefined
  }

  return multipleSiteDetails?.multipleSitesEnabled ? 'yes' : 'no'
}
