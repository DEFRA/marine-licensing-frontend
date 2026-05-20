export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText,
  options = {}
) {
  const hasValue = value && value !== ''
  const action = hasValue ? 'change' : 'add'
  const { skipAction, activityNumber, hideLinkText } = options

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
  const linkText = hasValue ? 'Change' : 'Add'
  const fullText = visuallyHiddenText
    ? `${linkText} ${visuallyHiddenText}`
    : linkText

  return {
    items: [
      {
        ...(href && { href: `${href}?${queryString}` }),
        ...(hideLinkText
          ? { html: `<span class="govuk-visually-hidden">${fullText}</span>` }
          : {
              text: linkText,
              ...(visuallyHiddenText && { visuallyHiddenText })
            }),
        classes: 'govuk-link--no-visited-state'
      }
    ]
  }
}
