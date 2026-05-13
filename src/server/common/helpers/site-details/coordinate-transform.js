export const transformCoordinatesForApi = (siteDetails) =>
  siteDetails.map((site) => {
    const { coordinates } = site
    if (
      coordinates &&
      !Array.isArray(coordinates) &&
      'eastings' in coordinates
    ) {
      return {
        ...site,
        coordinates: {
          easting: coordinates.eastings,
          northing: coordinates.northings
        }
      }
    }
    return site
  })
