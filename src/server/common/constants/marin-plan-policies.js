export const MARINE_PLAN_POLICY_STATUS = {
  COMPLETED: 'Completed',
  INCOMPLETE: 'Not yet started'
}

export const getMarinePlanPolicyTagStyle = (status) => {
  switch (status) {
    case 'INCOMPLETE':
      return 'govuk-tag--blue'
    default:
      return ''
  }
}
