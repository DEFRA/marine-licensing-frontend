const buildQueryString = (
  siteNumber,
  activityNumber,
  drawingNumber,
  skipAction,
  action
) => {
  const queryParams = []
  if (siteNumber) {
    queryParams.push(`site=${siteNumber}`)
  }
  if (activityNumber) {
    queryParams.push(`activity=${activityNumber}`)
  }
  if (drawingNumber) {
    queryParams.push(`drawing=${drawingNumber}`)
  }
  if (!skipAction) {
    queryParams.push(`action=${action}`)
  }
  return queryParams.join('&')
}

export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText,
  options = {}
) {
  const hasValue = value && value !== ''
  const action = hasValue ? 'change' : 'add'
  const { skipAction, activityNumber, drawingNumber, hideLinkText } = options

  const queryString = buildQueryString(
    siteNumber,
    activityNumber,
    drawingNumber,
    skipAction,
    action
  )
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
