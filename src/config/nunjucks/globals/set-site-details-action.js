export function setSiteDetailsAction(
  value,
  href,
  siteNumber,
  visuallyHiddenText
) {
  const hasValue = value && value !== ''

  const hrefWithSite = href
    ? `${href}?site=${siteNumber}&action=${hasValue ? 'change' : 'add'}`
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
