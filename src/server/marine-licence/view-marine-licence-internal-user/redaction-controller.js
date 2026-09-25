import Boom from '@hapi/boom'
import joi from 'joi'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { isClientSideFetchRequest } from '#src/server/common/helpers/is-client-side-fetch-request.js'
import { viewDetailsInternalUserController } from '#src/server/marine-licence/view-marine-licence-internal-user/controller.js'
import { REDACTION_LABEL } from '#src/server/common/helpers/marine-licence/redaction-label.js'
import {
  replaceDocumentUrls,
  REPLACE_DOCUMENT_TYPES
} from '#src/server/marine-licence/view-marine-licence-internal-user/replace-document/index.js'

const redactionPayloadSchema = joi.object({
  marineLicenceId: joi.string().optional(),
  fieldKey: joi.string().required(),
  index: joi.number().integer().min(0).optional(),
  activityIndex: joi.number().integer().min(0).optional(),
  drawingIndex: joi.number().integer().min(0).optional(),
  policyCode: joi.string().optional(),
  withhold: joi.boolean().optional(),
  remove: joi.boolean().optional(),
  text: joi
    .string()
    .allow('')
    .required()
    .when('withhold', { is: joi.exist(), then: joi.optional() })
    .when('remove', { is: joi.exist(), then: joi.optional() })
})

// no text when we are withholding
// default to label when empty
const resolveRedactionText = (text, withhold) => {
  if (withhold !== undefined) {
    return undefined
  }
  return !text || text.trim() === '' ? REDACTION_LABEL : text
}

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
    const { applicationReference } = request.params
    const {
      fieldKey,
      index,
      activityIndex,
      drawingIndex,
      marineLicenceId,
      policyCode,
      text,
      remove,
      withhold
    } = request.payload

    const viewUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${applicationReference}`
    const isFetch = isClientSideFetchRequest(request)

    const redactionText = resolveRedactionText(text, withhold)

    try {
      const service = getMarineLicenceService(request)
      await service.saveRedaction(marineLicenceId, fieldKey, redactionText, {
        siteIndex: index,
        activityIndex,
        drawingIndex,
        policyCode,
        remove,
        withhold
      })
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

const onlyForConstructionDrawing = joi.number().integer().min(1).when('type', {
  is: REPLACE_DOCUMENT_TYPES.CONSTRUCTION_DRAWING,
  then: joi.required(),
  otherwise: joi.forbidden()
})

const replaceDocumentQuerySchema = joi.object({
  type: joi
    .string()
    .valid(...Object.values(REPLACE_DOCUMENT_TYPES))
    .required(),
  site: onlyForConstructionDrawing,
  drawing: onlyForConstructionDrawing
})

export const replaceDocumentController = {
  options: {
    validate: {
      query: replaceDocumentQuerySchema,
      failAction
    }
  },
  handler(request, h) {
    const { applicationReference } = request.params
    const { type, site, drawing } = request.query

    const { uploadUrl } = replaceDocumentUrls(applicationReference, type, {
      site,
      drawing
    })

    return h.redirect(uploadUrl)
  }
}
