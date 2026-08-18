export const extractSiteNameFromFeature = (feature) => {
  const name = feature?.properties?.name

  if (typeof name !== 'string') {
    return null
  }

  const trimmed = name.trim()

  return trimmed || null
}

export const withExtractedSiteName = (
  site,
  feature,
  { preserveExisting = false } = {}
) => {
  const extractedSiteName = extractSiteNameFromFeature(feature)

  if (extractedSiteName) {
    return { ...site, siteName: extractedSiteName }
  }

  if (preserveExisting) {
    return site
  }

  const updatedSite = { ...site }
  delete updatedSite.siteName
  return updatedSite
}
