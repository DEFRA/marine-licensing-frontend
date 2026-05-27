export const getSiteParam = (siteNumber) =>
  siteNumber > 1 ? `?site=${siteNumber}` : ''
