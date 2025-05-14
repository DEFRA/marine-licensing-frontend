import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { config } from '~/src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'

import Wreck from '@hapi/wreck'
import joi from 'joi'

export const PUBLIC_REGISTER_ROUTE = '/exemption/public-register'
export const PUBLIC_REGISTER_VIEW_ROUTE = 'exemption/public-register/index'

export const errorMessages = {
  PUBLIC_REGISTER_REASON_REQUIRED:
    'Details of why the information should be withheld cannot be blank',
  PUBLIC_REGISTER_REASON_MAX_LENGTH:
    'Details of why the information should be witheld must be 1000 characters or less',
  PUBLIC_REGISTER_CONSENT_REQUIRED:
    'Select whether you believe your information should be withheld from the public register'
}

const publicRegisterSettings = {
  pageTitle: 'Public register',
  heading: 'Public register'
}

/**
 * A GDS styled public register page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const publicRegisterController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
      ...publicRegisterSettings,
      projectName: exemption.projectName,
      payload: exemption.publicRegister
    })
  }
}

/**
 * A GDS styled public register page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const publicRegisterSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        consent: joi.string().valid('yes', 'no').required().messages({
          'any.only': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
          'string.empty': 'PUBLIC_REGISTER_CONSENT_REQUIRED',
          'any.required': 'PUBLIC_REGISTER_CONSENT_REQUIRED'
        }),
        reason: joi.when('consent', {
          is: 'yes',
          then: joi.string().required().messages({
            'string.empty': 'PUBLIC_REGISTER_REASON_REQUIRED',
            'any.required': 'PUBLIC_REGISTER_REASON_REQUIRED'
          })
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        const { projectName } = getExemptionCache(request)

        if (!err.details) {
          return h
            .view(PUBLIC_REGISTER_VIEW_ROUTE, {
              ...publicRegisterSettings,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PUBLIC_REGISTER_VIEW_ROUTE, {
            ...publicRegisterSettings,
            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const exemption = getExemptionCache(request)

    try {
      const isAnswerYes = payload.consent === 'yes'

      await Wreck.patch(
        `${config.get('backend').apiUrl}/exemption/public-register`,
        {
          payload: {
            consent: payload.consent,
            ...(isAnswerYes && { reason: payload.reason }),
            id: exemption.id
          },
          json: true
        }
      )

      setExemptionCache(request, {
        ...exemption,
        publicRegister: {
          consent: payload.consent,
          ...(isAnswerYes && { reason: payload.reason })
        }
      })

      return h.redirect('/exemption/task-list')
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PUBLIC_REGISTER_VIEW_ROUTE, {
        ...publicRegisterSettings,
        payload,
        projectName: exemption.projectName,
        errors,
        errorSummary
      })
    }
  }
}
