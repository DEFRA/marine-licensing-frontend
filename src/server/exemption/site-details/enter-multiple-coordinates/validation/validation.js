import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { isWGS84 } from '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js'

export const getValidationSchema = (coordinateSystem) => {
  return isWGS84(coordinateSystem)
    ? createWgs84MultipleCoordinatesSchema()
    : createOsgb36MultipleCoordinatesSchema()
}
export const validateCoordinates = (
  coordinates,
  exemptionId,
  coordinateSystem
) => {
  const validationPayload = { coordinates, id: exemptionId }
  const schema = getValidationSchema(coordinateSystem)

  return schema.validate(validationPayload, { abortEarly: false })
}
