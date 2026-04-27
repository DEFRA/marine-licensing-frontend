import { createWgs84MultipleCoordinatesSchema } from '#src/server/common/schemas/wgs84.js'
import { createOsgb36MultipleCoordinatesSchema } from '#src/server/common/schemas/osgb36.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'

export const getValidationSchema = (coordinateSystem) =>
  coordinateSystem === COORDINATE_SYSTEMS.WGS84
    ? createWgs84MultipleCoordinatesSchema()
    : createOsgb36MultipleCoordinatesSchema()

export const validateCoordinates = (coordinates, id, coordinateSystem) => {
  const schema = getValidationSchema(coordinateSystem)
  return schema.validate({ coordinates, id }, { abortEarly: false })
}
