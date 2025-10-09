export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText
) {
  const hasValue = value && value !== ''

  const action = hasValue ? 'change' : 'add'

  const hrefWithSite = href
    ? `${href}?site=${siteNumber}&action=${action}`
    : '#'

  return {
    items: [
      {
        href: hrefWithSite,
        text: hasValue ? 'Change' : 'Add',
        ...(visuallyHiddenText && { visuallyHiddenText })
      }
    ]
  }
}
