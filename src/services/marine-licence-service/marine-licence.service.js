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
        {
          event: {
            action: 'get-marine-licence-data',
            outcome: 'failure',
            reason: errorMessages.MARINE_LICENCE_NOT_FOUND
          }
        },
        `${errorMessages.MARINE_LICENCE_NOT_FOUND} does not have id or applicationReference`
      )
      throw new Error(errorMessages.MARINE_LICENCE_NOT_FOUND)
    }

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
        {
          event: {
            action: 'get-marine-licence-data',
            outcome: 'failure',
            reference: id,
            reason: errorMessages.MARINE_LICENCE_DATA_NOT_FOUND
          }
        },
        `${errorMessages.MARINE_LICENCE_DATA_NOT_FOUND} for ${id}`
      )
      throw new Error(errorMessages.MARINE_LICENCE_DATA_NOT_FOUND)
    }

    return payload.value
  }

  async saveRedaction(id, fieldKey, text, options = {}) {
    const body = Object.fromEntries(
      Object.entries({ text, ...options }).filter(
        ([, value]) => value !== undefined
      )
    )

    const { payload } = await authenticatedPostRequest(
      this.request,
      apiRoutes.REDACT_TEXT,
      { id, fieldKey, ...body }
    )

    if (payload?.message !== 'success') {
      this.logger.error(
        {
          event: {
            action: 'redact-marine-licence',
            outcome: 'failure',
            reference: id,
            reason: errorMessages.MARINE_LICENCE_REDACTION_FAILED
          }
        },
        `${errorMessages.MARINE_LICENCE_REDACTION_FAILED} for ${id} on field ${fieldKey}`
      )
      throw new Error(errorMessages.MARINE_LICENCE_REDACTION_FAILED)
    }
  }
}
