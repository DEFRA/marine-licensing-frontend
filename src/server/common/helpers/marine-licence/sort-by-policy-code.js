export const sortByPolicyCode = (policies) =>
  [...policies].sort((a, b) => a.policyCode.localeCompare(b.policyCode))
