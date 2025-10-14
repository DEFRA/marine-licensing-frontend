export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText
) {
  const hasValue = value && value !== ''

  const action = hasValue ? 'change' : 'add'

  return {
    items: [
      {
        ...(href && { href: `${href}?site=${siteNumber}&action=${action}` }),
        text: hasValue ? 'Change' : 'Add',
        ...(visuallyHiddenText && { visuallyHiddenText }),
        classes: 'govuk-link--no-visited-state'
      }
    ]
  }
}
