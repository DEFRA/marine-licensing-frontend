import joi from 'joi'
import Boom from '@hapi/boom'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  marineLicenceRoutes,
  apiRoutes
} from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const MARINE_PLAN_POLICY_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy/index'

const FIND_OUT_MORE_BASE =
  'https://environment.data.gov.uk/marine-plans-explorer/policy/'

const MAX_RESPONSE_LENGTH = 2000

export const errorMessages = {
  POLICY_CONSIDERATION_REQUIRED: 'Enter how you have considered this policy',
  POLICY_CONSIDERATION_MAX_LENGTH:
    'Policy consideration must be 2000 characters or less'
}

const CHECK_YOUR_ANSWERS_RETURN_LINK = `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#marine-plan-policies-card`

const getPolicyReturnLink = (returnTo) => {
  if (returnTo) {
    return CHECK_YOUR_ANSWERS_RETURN_LINK
  }
  return marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
}

const loadPolicyContext = async (request) => {
  const marineLicence = getMarineLicenceCache(request)

  if (!marineLicence?.id) {
    throw Boom.notFound('Marine licence not found')
  }

  const { policyCode } = request.params
  const marineLicenceService = getMarineLicenceService(request)
  const { projectName, marinePlanPolicies, marinePlanPolicyResponses } =
    await marineLicenceService.getMarineLicenceById(marineLicence.id)

  const policy = (marinePlanPolicies ?? []).find(
    (item) => item.policyCode === policyCode
  )

  if (!policy) {
    throw Boom.notFound('Marine plan policy not found')
  }

  return {
    id: marineLicence.id,
    policyCode,
    projectName,
    policy,
    existingResponse: marinePlanPolicyResponses?.[policyCode] ?? '',
    returnTo: request.yar?.get(RETURN_TO_CACHE_KEY)
  }
}

const buildRenderModel = ({
  policyCode,
  projectName,
  policy,
  payload,
  returnTo
}) => ({
  pageTitle: policyCode,
  heading: policyCode,
  projectName,
  policyText: policy.policy,
  findOutMoreUrl: `${FIND_OUT_MORE_BASE}${encodeURIComponent(policyCode)}`,
  backLink: getPolicyReturnLink(returnTo),
  marinePlanPolicyGuidanceLink:
    marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
  payload
})

export const marinePlanPolicyController = {
  async handler(request, h) {
    const context = await loadPolicyContext(request)

    return h.view(
      MARINE_PLAN_POLICY_VIEW_ROUTE,
      buildRenderModel({
        ...context,
        payload: { policyConsideration: context.existingResponse }
      })
    )
  }
}

export const marinePlanPolicySubmitController = {
  options: {
    validate: {
      payload: joi.object({
        policyConsideration: joi
          .string()
          .trim()
          .max(MAX_RESPONSE_LENGTH)
          .required()
          .messages({
            'string.empty': errorMessages.POLICY_CONSIDERATION_REQUIRED,
            'any.required': errorMessages.POLICY_CONSIDERATION_REQUIRED,
            'string.max': errorMessages.POLICY_CONSIDERATION_MAX_LENGTH
          })
      }),
      failAction: async (request, h, err) => {
        const context = await loadPolicyContext(request)
        const model = buildRenderModel({
          ...context,
          payload: request.payload
        })

        if (!err.details) {
          return h.view(MARINE_PLAN_POLICY_VIEW_ROUTE, model).takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(MARINE_PLAN_POLICY_VIEW_ROUTE, {
            ...model,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { id, policyCode, returnTo } = await loadPolicyContext(request)

    await authenticatedPatchRequest(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_RESPONSE,
      {
        id,
        policyCode,
        response: request.payload.policyConsideration
      }
    )

    return h.redirect(getPolicyReturnLink(returnTo))
  }
}
