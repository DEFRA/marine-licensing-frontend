import Clarity from '@microsoft/clarity'

const hasAcceptedAnalytics = () => globalThis.ANALYTICS_ENABLED === true

// Clarity is only loaded once the user has accepted analytics cookies. Without consent the
// script would still record page views and sessions in its cookieless mode, which the cookies
// page tells users they can refuse.
export const initClarity = () => {
  const projectId = globalThis.CLARITY_PROJECT_ID

  if (!projectId || !hasAcceptedAnalytics()) {
    return false
  }

  Clarity.init(projectId)
  Clarity.consent(true)
  return true
}
