export const getSiteDetailsBySite = (project, siteIndex = 0) =>
  project.siteDetails?.[siteIndex] ?? {}
