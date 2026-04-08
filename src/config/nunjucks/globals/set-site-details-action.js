export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText,
  skipAction
) {
  const hasValue = value && value !== ''

  const action = hasValue ? 'change' : 'add'

  let queryString = siteNumber
    ? `site=${siteNumber}${skipAction ? '' : '&'}`
    : ''

  if (!skipAction) {
    queryString += `action=${action}`
  }

  return {
    items: [
      {
        ...(href && {
          href: `${href}?${queryString}`
        }),
        text: hasValue ? 'Change' : 'Add',
        ...(visuallyHiddenText && { visuallyHiddenText }),
        classes: 'govuk-link--no-visited-state'
      }
    ]
  }
}
