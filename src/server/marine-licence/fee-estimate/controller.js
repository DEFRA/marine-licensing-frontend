import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import joi from 'joi'

export const FEE_ESTIMATE_VIEW_ROUTE = 'marine-licence/fee-estimate/index'

export const FEES_TERMS_AND_CONDITIONS_URL =
  'https://assets.publishing.service.gov.uk/media/63567839e90e0777b38c5d02/FEES_Terms_and_Conditions.pdf'

export const FEES_URL =
  'https://www.gov.uk/government/publications/marine-licensing-fees'

export const errorMessages = {
  FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED:
    'You need to agree to the terms and conditions',
  FEE_ESTIMATE_ACCEPT_REQUIRED: 'Select if you accept the fee estimate'
}

const feeEstimateSettings = {
  pageTitle: 'Fee estimate',
  heading: 'Fee estimate'
}

export const feeEstimateController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    const { feeEstimate = {} } = marineLicence

    return h.view(FEE_ESTIMATE_VIEW_ROUTE, {
      ...feeEstimateSettings,
      projectName: marineLicence.projectName,
      feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
      feesUrl: FEES_URL,
      payload: {
        termsAndConditions: feeEstimate.termsAndConditions,
        accept: feeEstimate.accept,
        feeBand: '2A'
      },
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    })
  }
}

export const feeEstimateSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        termsAndConditions: joi.valid('true').required().messages({
          'any.only': errorMessages.FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED,
          'any.required':
            errorMessages.FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED
        }),
        accept: joi.string().valid('yes', 'no').required().messages({
          'string.empty': errorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED,
          'any.required': errorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED,
          'any.only': errorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED
        }),
        feeBand: joi.string().valid('2A').required()
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getMarineLicenceCache(request)

        if (!err.details) {
          return h
            .view(FEE_ESTIMATE_VIEW_ROUTE, {
              ...feeEstimateSettings,
              payload,
              projectName,
              feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
              feesUrl: FEES_URL,
              backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(FEE_ESTIMATE_VIEW_ROUTE, {
            ...feeEstimateSettings,
            payload,
            projectName,
            feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
            feesUrl: FEES_URL,
            backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const marineLicence = getMarineLicenceCache(request)

    try {
      await authenticatedPatchRequest(request, apiRoutes.UPDATE_FEE_ESTIMATE, {
        termsAndConditions: payload.termsAndConditions,
        accept: payload.accept,
        feeBand: payload.feeBand,
        id: marineLicence.id
      })

      await setMarineLicenceCache(request, h, {
        ...marineLicence,
        feeEstimate: {
          termsAndConditions: payload.termsAndConditions,
          accept: payload.accept,
          feeBand: payload.feeBand
        }
      })

      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    } catch (e) {
      const validation = e.data?.payload?.validation
      const details = validation?.details

      if (!Array.isArray(details)) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(FEE_ESTIMATE_VIEW_ROUTE, {
        ...feeEstimateSettings,
        payload,
        projectName: marineLicence.projectName,
        feesTermsAndConditionsUrl: FEES_TERMS_AND_CONDITIONS_URL,
        feesUrl: FEES_URL,
        backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        errors,
        errorSummary
      })
    }
  }
}
