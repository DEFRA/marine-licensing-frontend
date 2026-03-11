import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'

const apiPaths = {
  getMarineLicence: (id) => `/marine-licence/${id}`,
  getPublicMarineLicence: (id) => `/public/marine-licence/${id}`
}

export class MarineLicenceService {
  constructor(request, logger = null) {
    this.request = request
    this.logger = logger ?? createLogger()
  }

  async getMarineLicenceById(id) {
    return this.getMarineLicenceData({ id })
  }

  async getPublicMarineLicenceById(id) {
    return this.getMarineLicenceData({ id, isPublic: true })
  }

  async getMarineLicenceData({ id, isPublic = false }) {
    if (!id) {
      this.logger.error({ id }, errorMessages.MARINE_LICENCE_NOT_FOUND)
      throw new Error(errorMessages.MARINE_LICENCE_NOT_FOUND)
    }

    const endpoint = isPublic
      ? apiPaths.getPublicMarineLicence(id)
      : apiPaths.getMarineLicence(id)
    const { payload } = await authenticatedGetRequest(this.request, endpoint)

    if (payload?.message !== 'success' || !payload.value) {
      this.logger.error({ id }, errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
      throw new Error(errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
    }

    return payload.value
  }
}
