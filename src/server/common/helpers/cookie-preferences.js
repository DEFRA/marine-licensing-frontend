/**
 * Get cookie preferences from request
 * @param {object} request - Hapi request object
 * @returns {object} Cookie preferences object
 */
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

/**
 * Check if analytics cookies are accepted
 * @param {object} request - Hapi request object
 * @returns {boolean} True if analytics cookies are accepted
 */
export function areAnalyticsCookiesAccepted(request) {
  const preferences = getCookiePreferences(request)
  return preferences.analytics === true
}
