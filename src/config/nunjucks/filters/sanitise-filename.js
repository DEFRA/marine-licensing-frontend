export function sanitiseFilename(value, maxLength = 64) {
  const truncationToken = '...'
  const truncationTokenLength = truncationToken.length
  const wordBoundarySearchLength = 8

  // Handle null, undefined, or empty values
  if (!value || typeof value !== 'string') {
    return ''
  }

  // Remove control characters and potentially dangerous characters
  // Keep alphanumeric, spaces, dots, hyphens, underscores, and basic punctuation
  const sanitised = value
    .replaceAll(/[^ -~]/g, '') // e.g. allow space through to tilde
    .replaceAll(/[<>:"/\\|?*]/g, '') // Remove characters dangerous in filenames/HTML
    .replaceAll(/\s+/g, ' ') // Normalise whitespace
    .trim()

  // Handle truncation
  if (sanitised.length <= maxLength) {
    return sanitised
  }

  // Truncate and add ellipsis, ensuring we don't break in the middle of a word if possible
  const truncated = sanitised.substring(0, maxLength - truncationTokenLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  // If there's a space within the last 8 characters, break at the word boundary
  if (
    lastSpaceIndex >
    maxLength - (wordBoundarySearchLength + truncationTokenLength)
  ) {
    return truncated.substring(0, lastSpaceIndex) + truncationToken
  }

  return truncated + truncationToken
}
