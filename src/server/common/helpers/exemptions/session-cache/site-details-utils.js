export const getSiteDetailsBySite = (project, siteIndex = 0) => {
  const { multipleSiteDetails } = project

  if (!multipleSiteDetails?.multipleSitesEnabled) {
    return project.siteDetails?.[0] ?? {}
  }

  return project.siteDetails?.[siteIndex] ?? {}
}
