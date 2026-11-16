export const MARINE_PLAN_POLICY_STATUS = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  INCOMPLETE: 'Not yet started'
}

const MARINE_PLAN_POLICY_TAG_STYLES = {
  IN_PROGRESS: 'govuk-tag--teal',
  INCOMPLETE: 'govuk-tag--blue'
}

export const getMarinePlanPolicyTagStyle = (status) =>
  MARINE_PLAN_POLICY_TAG_STYLES[status] ?? ''
