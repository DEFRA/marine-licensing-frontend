export const MARINE_PLAN_POLICIES_GUIDANCE_VIEW_ROUTE =
  'marine-licence/marine-plan-policies-guidance/index'

export const marinePlanPoliciesGuidanceController = {
  handler(_request, h) {
    return h.view(MARINE_PLAN_POLICIES_GUIDANCE_VIEW_ROUTE, {
      pageTitle: 'Marine plan policy guidance',
      heading: 'Marine plan policy guidance'
    })
  }
}
