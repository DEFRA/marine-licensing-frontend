export const requestBody = ({ coordinates = [], system }) => {
  const label1 = system === 'WGS84' ? 'latitude' : 'easting'
  const label2 = system === 'WGS84' ? 'longitude' : 'northing'
  return coordinates.reduce((acc, [coord1, coord2], idx) => {
    acc[`coordinates[${idx}][${label1}]`] = coord1
    acc[`coordinates[${idx}][${label2}]`] = coord2
    return acc
  }, {})
}
