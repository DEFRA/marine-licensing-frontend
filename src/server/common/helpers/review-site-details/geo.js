export const hasValidGeometry = (feature) => {
  const geometry = feature.geometry
  return (
    geometry?.type &&
    geometry?.coordinates &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0
  )
}

export const extractCoordinateData = (feature) => ({
  type: feature.geometry.type,
  coordinates: feature.geometry.coordinates
})

export const parseGeoJSONCoordinates = (geoJSON) => {
  const features = geoJSON.features
  if (!features || !Array.isArray(features)) {
    return []
  }

  return features.filter(hasValidGeometry).map(extractCoordinateData)
}
