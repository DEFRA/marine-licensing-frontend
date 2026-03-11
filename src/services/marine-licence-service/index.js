import { MarineLicenceService } from '#src/services/marine-licence-service/marine-licence.service.js'

export function getMarineLicenceService(request) {
  return new MarineLicenceService(request)
}

export { MarineLicenceService } from '#src/services/marine-licence-service/marine-licence.service.js'
