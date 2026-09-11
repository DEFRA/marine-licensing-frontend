import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'

const apiPaths = {
  getMarineLicence: (id) => `/marine-licence/${id}`,
  getPublicMarineLicence: (id) => `/public/marine-licence/${id}`,
  getMarineLicenceByReference: (applicationReference) =>
    `/marine-licence/applicationReference/${applicationReference}`
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

  async getMarineLicenceByReference(applicationReference) {
    return this.getMarineLicenceData({ applicationReference })
  }

  async getMarineLicenceData({ id, applicationReference, isPublic = false }) {
    if (!id && !applicationReference) {
      this.logger.error(
        { id, applicationReference },
        errorMessages.MARINE_LICENCE_NOT_FOUND
      )
      throw new Error(errorMessages.MARINE_LICENCE_NOT_FOUND)
    }

    console.log('GETS PASSED')

    let endpoint
    if (applicationReference) {
      endpoint = apiPaths.getMarineLicenceByReference(applicationReference)
    } else if (isPublic) {
      endpoint = apiPaths.getPublicMarineLicence(id)
    } else {
      endpoint = apiPaths.getMarineLicence(id)
    }

    const { payload } = await authenticatedGetRequest(this.request, endpoint)

    if (payload?.message !== 'success' || !payload.value) {
      this.logger.error(
        { id, applicationReference },
        errorMessages.MARINE_LICENCE_DATA_NOT_FOUND
      )
      throw new Error(errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
    }

    return payload.value
  }

  async saveRedaction(id, fieldKey, text) {
    const { payload } = await authenticatedPostRequest(
      this.request,
      apiRoutes.REDACT_TEXT,
      { id, fieldKey, text }
    )
    if (payload?.message !== 'success') {
      this.logger.error(
        { id, fieldKey },
        errorMessages.MARINE_LICENCE_REDACTION_FAILED
      )
      throw new Error(errorMessages.MARINE_LICENCE_REDACTION_FAILED)
    }
  }
}
