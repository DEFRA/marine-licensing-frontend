export function isValidReferrerPath(referrerPath, excludedPaths = []) {
  if (!referrerPath || typeof referrerPath !== 'string') {
    return false
  }

  if (!referrerPath.startsWith('/')) {
    return false
  }

  if (excludedPaths.includes(referrerPath)) {
    return false
  }

  const suspiciousPatterns = [
    /\.\./,
    /\/\//,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ]

  return !suspiciousPatterns.some((pattern) => pattern.test(referrerPath))
}

export function extractReferrerPath(referrerUrl) {
  if (!referrerUrl || typeof referrerUrl !== 'string') {
    return null
  }

  try {
    const referrer = new URL(referrerUrl)
    return referrer.pathname
  } catch {
    // Invalid URL
    return null
  }
}

export function storeReferrer(request, referrerUrl, excludedPaths = []) {
  const referrerPath = extractReferrerPath(referrerUrl)

  if (referrerPath && isValidReferrerPath(referrerPath, excludedPaths)) {
    request.yar.set('pageReferrer', referrerPath)
  }
}

export function getStoredReferrer(request, excludedPaths = []) {
  const storedReferrerPath = request.yar.get('pageReferrer')

  if (
    storedReferrerPath &&
    isValidReferrerPath(storedReferrerPath, excludedPaths)
  ) {
    return storedReferrerPath
  }

  return null
}

export function clearStoredReferrer(request) {
  request.yar.clear('pageReferrer')
}

export function getBackUrl(request, fallbackUrl = '/', excludedPaths = []) {
  const storedReferrer = getStoredReferrer(request, excludedPaths)
  return storedReferrer || fallbackUrl
}

/**
 * Safely validate and extract referrer path for redirect
 * @param {string} refererHeader - The referer header from the request
 * @param {string[]} excludedPaths - Paths to exclude from validation
 * @returns {string|null} Valid referrer path or null if invalid
 */
export function getValidatedReferrerPath(refererHeader, excludedPaths = []) {
  if (!refererHeader) {
    return null
  }

  const referrerPath = extractReferrerPath(refererHeader)

  if (referrerPath && isValidReferrerPath(referrerPath, excludedPaths)) {
    return referrerPath
  }

  return null
}
