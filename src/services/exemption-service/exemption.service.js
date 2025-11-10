import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'

const apiPaths = {
  getExemption: (id) => `/exemption/${id}`,
  submitExemption: '/exemption/submit'
}

export class ExemptionService {
  constructor(request, logger = null) {
    this.request = request
    this.logger = logger ?? createLogger()
  }

  async getExemptionById(id) {
    if (!id) {
      this.logger.error({ id }, errorMessages.EXEMPTION_NOT_FOUND)
      throw new Error(errorMessages.EXEMPTION_NOT_FOUND)
    }

    const { payload } = await authenticatedGetRequest(
      this.request,
      apiPaths.getExemption(id)
    )

    if (payload?.message !== 'success' || !payload.value) {
      this.logger.error({ id }, errorMessages.EXEMPTION_DATA_NOT_FOUND)
      throw new Error(errorMessages.EXEMPTION_DATA_NOT_FOUND)
    }
    return payload.value
  }
}
