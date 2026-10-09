const buildQueryString = (
  siteNumber,
  activityNumber,
  drawingNumber,
  evidenceIndex,
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
  if (evidenceIndex) {
    queryParams.push(`location=${evidenceIndex}`)
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
  const {
    skipAction,
    activityNumber,
    drawingNumber,
    evidenceIndex,
    hideLinkText
  } = options

  const queryString = buildQueryString(
    siteNumber,
    activityNumber,
    drawingNumber,
    evidenceIndex,
    skipAction,
    action
  )
  const linkText = hasValue ? 'Change' : 'Add'
  const fullText = visuallyHiddenText
    ? `${linkText} ${visuallyHiddenText}`
    : linkText
  // The summary list puts visuallyHiddenText in its own span and trims the
  // leading space, which glues it to the link text in the accessible name.
  const visibleText = visuallyHiddenText ? `${linkText} ` : linkText

  return {
    items: [
      {
        ...(href && { href: `${href}?${queryString}` }),
        ...(hideLinkText
          ? { html: `<span class="govuk-visually-hidden">${fullText}</span>` }
          : {
              text: visibleText,
              ...(visuallyHiddenText && { visuallyHiddenText })
            }),
        classes: 'govuk-link--no-visited-state'
      }
    ]
  }
}
