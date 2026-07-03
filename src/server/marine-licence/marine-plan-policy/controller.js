import Boom from '@hapi/boom'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const MARINE_PLAN_POLICY_VIEW_ROUTE =
  'marine-licence/marine-plan-policy/index'

const FIND_OUT_MORE_BASE =
  'https://environment.data.gov.uk/marine-plans-explorer/policy/'

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
    policyCode,
    projectName,
    policy,
    existingResponse: marinePlanPolicyResponses?.[policyCode] ?? ''
  }
}

const buildRenderModel = ({ policyCode, projectName, policy, payload }) => ({
  pageTitle: policyCode,
  heading: policyCode,
  projectName,
  policyText: policy.policy,
  findOutMoreUrl: `${FIND_OUT_MORE_BASE}${encodeURIComponent(policyCode)}`,
  backLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
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
