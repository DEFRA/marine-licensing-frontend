export const MARINE_PLAN_POLICY_STATUS = {
  COMPLETED: 'Completed',
  INCOMPLETE: 'Not yet started'
}
export const getMarinePlanPolicyTagStyle = (status) =>
  status === 'INCOMPLETE' ? 'govuk-tag--blue' : ''
