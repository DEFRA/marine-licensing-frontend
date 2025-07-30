/**
 * Extract coordinate data from GeoJSON for display purposes
 * @param {object} geoJSON - GeoJSON object containing features
 * @returns {Array} Array of extracted coordinates with type and coordinates properties
 */
export function extractCoordinatesFromGeoJSON(geoJSON) {
  if (!geoJSON?.features) {
    return []
  }

  const extractedCoordinates = []
  for (const feature of geoJSON.features) {
    if (feature.geometry?.coordinates) {
      extractedCoordinates.push({
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates
      })
    }
  }

  return extractedCoordinates
}
