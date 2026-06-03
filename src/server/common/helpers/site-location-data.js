import { formatDate } from '#src/server/common/helpers/dates/date-utils.js'

export const buildSiteLocationData = (multipleSiteDetails, siteDetails) => {
  if (!siteDetails?.[0]) {
    return null
  }

  const { multipleSitesEnabled, sameActivityDates, sameActivityDescription } =
    multipleSiteDetails ?? {}

  const siteLocationData = {
    multipleSiteDetails: multipleSitesEnabled ? 'Yes' : 'No',
    sameActivityDates: sameActivityDates === 'yes' ? 'Yes' : 'No',
    sameActivityDescription: sameActivityDescription === 'yes' ? 'Yes' : 'No',
    multipleSitesEnabled
  }

  const firstSite = siteDetails[0]

  siteLocationData.method =
    firstSite.coordinatesType === 'coordinates'
      ? 'Enter the coordinates of the site manually'
      : 'File uploaded'

  siteLocationData.isFileUpload = firstSite.coordinatesType === 'file'

  if (sameActivityDates === 'yes') {
    siteLocationData.activityDates = `${formatDate(firstSite.activityDates?.start)} to ${formatDate(firstSite.activityDates?.end)}`
  }

  if (sameActivityDescription === 'yes') {
    siteLocationData.activityDescription = firstSite.activityDescription
  }

  return siteLocationData
}
