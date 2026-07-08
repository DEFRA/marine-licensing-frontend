export const MARINE_PLAN_POLICY_GUIDANCE_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-guidance/index'

export const marinePlanPolicyGuidanceController = {
  handler(_request, h) {
    return h.view(MARINE_PLAN_POLICY_GUIDANCE_VIEW_ROUTE, {
      pageTitle: 'Marine plan policy guidance',
      heading: 'Marine plan policy guidance'
    })
  }
}
