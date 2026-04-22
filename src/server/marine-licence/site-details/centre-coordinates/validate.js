import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { wgs84ValidationSchema } from '#src/server/common/schemas/wgs84.js'
import { osgb36ValidationSchema } from '#src/server/common/schemas/osgb36.js'

export const validateCentreCoordinates = (payload, coordinateSystem) => {
  const schema =
    coordinateSystem === COORDINATE_SYSTEMS.OSGB36
      ? osgb36ValidationSchema
      : wgs84ValidationSchema

  const { error, value } = schema.validate(payload, {
    abortEarly: false
  })

  return { error, value }
}
