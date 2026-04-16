export const getSiteDetailsBySite = (project, siteIndex = 0) =>
  project.siteDetails?.[siteIndex] ?? {}

export const getActivityDetailsByIndex = (
  project,
  siteIndex = 0,
  activityIndex = 0
) => project.siteDetails?.[siteIndex].activityDetails[activityIndex] ?? {}
