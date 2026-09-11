import Boom from '@hapi/boom'
import joi from 'joi'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { isClientSideFetchRequest } from '#src/server/common/helpers/is-client-side-fetch-request.js'
import { viewDetailsInternalUserController } from '#src/server/marine-licence/view-marine-licence-internal-user/controller.js'
import { REDACTION_LABEL } from '#src/server/marine-licence/view-details/utils.js'

const REDACTION_TEXT_MAX_LENGTH = 1000

const redactionPayloadSchema = joi.object({
  fieldKey: joi.string().required(),
  text: joi.string().allow('').max(REDACTION_TEXT_MAX_LENGTH).required()
})

const failAction = (request, h, error) => {
  request.logger.error({ err: error }, 'Invalid redaction payload')
  return h.response().code(statusCodes.badRequest).takeover()
}

export const saveRedactionController = {
  options: {
    validate: {
      payload: redactionPayloadSchema,
      failAction
    }
  },
  async handler(request, h) {
    const { marineLicenceId } = request.params
    const { fieldKey, text } = request.payload

    const viewUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${marineLicenceId}`
    const isFetch = isClientSideFetchRequest(request)

    const redactionText = text.trim() === '' ? REDACTION_LABEL : text

    try {
      const service = getMarineLicenceService(request)
      await service.saveRedaction(marineLicenceId, fieldKey, redactionText)
    } catch (error) {
      request.logger.error(error, 'Error saving marine licence redaction')

      if (!isFetch) {
        return h.redirect(viewUrl)
      }

      throw Boom.internal('Error saving marine licence redaction')
    }

    if (!isFetch) {
      return h.redirect(viewUrl)
    }

    return viewDetailsInternalUserController.handler(request, h)
  }
}
