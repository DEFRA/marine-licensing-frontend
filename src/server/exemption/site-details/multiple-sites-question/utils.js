export const getMultipleSitesEnabledValue = (multipleSiteDetails) => {
  if (multipleSiteDetails?.multipleSitesEnabled === undefined) {
    return undefined
  }

  return multipleSiteDetails?.multipleSitesEnabled ? 'yes' : 'no'
}
