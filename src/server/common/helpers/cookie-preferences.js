export function getCookiePreferences(request) {
  const cookiesPolicy = request.state?.cookies_policy

  if (!cookiesPolicy) {
    return {
      essential: true,
      analytics: false,
      timestamp: null
    }
  }

  // The cookie is automatically decoded by Hapi server.state() configuration
  // No need to manually base64 decode or parse JSON as it's already an object
  return cookiesPolicy
}
export function areAnalyticsCookiesAccepted(request) {
  const preferences = getCookiePreferences(request)
  return preferences.analytics === true
}
