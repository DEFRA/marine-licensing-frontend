export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText
) {
  const hasValue = value && value !== ''

  const action = hasValue ? 'change' : 'add'

  const queryString = siteNumber
    ? `site=${siteNumber}&action=${action}`
    : `action=${action}`

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
