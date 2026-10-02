// Until the policies API is populated, title is often just the code repeated.
const getPolicyTitle = ({ title, policyCode }) => {
  const trimmed = typeof title === 'string' ? title.trim() : ''
  return trimmed && trimmed !== policyCode ? trimmed : null
}

export const formatPolicyTitle = (policy) => {
  const title = getPolicyTitle(policy)
  return title ? `${title} (${policy.policyCode})` : policy.policyCode
}
