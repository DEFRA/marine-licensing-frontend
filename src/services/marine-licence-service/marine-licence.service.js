import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'

const apiPaths = {
  getMarineLicence: (id) => `/marine-licence/${id}`
}

export class MarineLicenceService {
  constructor(request, logger = null) {
    this.request = request
    this.logger = logger ?? createLogger()
  }

  async getMarineLicenceById(id) {
    if (!id) {
      this.logger.error({ id }, errorMessages.MARINE_LICENCE_NOT_FOUND)
      throw new Error(errorMessages.MARINE_LICENCE_NOT_FOUND)
    }

    const { payload } = await authenticatedGetRequest(
      this.request,
      apiPaths.getMarineLicence(id)
    )

    if (payload?.message !== 'success' || !payload.value) {
      this.logger.error({ id }, errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
      throw new Error(errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
    }

    return payload.value
  }
}
