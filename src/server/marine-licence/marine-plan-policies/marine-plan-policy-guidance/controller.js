export const MARINE_PLAN_POLICY_GUIDANCE_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-guidance/index'

export const marinePlanPolicyGuidanceController = {
  handler(_request, h) {
    return h.view(MARINE_PLAN_POLICY_GUIDANCE_VIEW_ROUTE, {
      pageTitle: 'Marine plan policies guidance',
      heading: 'Marine plan policies guidance'
    })
  }
}
