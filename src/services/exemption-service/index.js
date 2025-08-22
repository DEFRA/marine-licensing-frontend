import { ExemptionService } from '~/src/services/exemption-service/exemption.service.js'

export function getExemptionService(request) {
  return new ExemptionService(request)
}

export { ExemptionService }
