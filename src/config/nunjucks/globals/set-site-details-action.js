export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText,
  options = {}
) {
  const hasValue = value && value !== ''
  const action = hasValue ? 'change' : 'add'
  const { skipAction, activityNumber } = options

  const queryParams = []

  if (siteNumber) {
    queryParams.push(`site=${siteNumber}`)
  }

  if (activityNumber) {
    queryParams.push(`activity=${activityNumber}`)
  }

  if (!skipAction) {
    queryParams.push(`action=${action}`)
  }

  const queryString = queryParams.join('&')

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
