const GOOGLE_ANALYTICS_COOKIE_PREFIXES = ['_ga', '_gid', '_gat', '_dc_gtm_']
const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'

// Google sets its cookies on the registrable domain (eTLD+1), which the page cannot read back,
// so a deletion is attempted on the host and on every parent domain
export const buildDeletableDomains = (hostname) => {
  const domains = new Set([hostname, `.${hostname}`])
  const labels = hostname.split('.')

  for (let index = 1; index < labels.length - 1; index++) {
    domains.add(`.${labels.slice(index).join('.')}`)
  }

  return [...domains]
}

const isGoogleAnalyticsCookie = (name) =>
  GOOGLE_ANALYTICS_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))

const cookieNames = () =>
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter(Boolean)

const expireCookie = (name, domains) => {
  document.cookie = `${name}=;${EXPIRED};path=/`
  for (const domain of domains) {
    document.cookie = `${name}=;${EXPIRED};path=/;domain=${domain}`
  }
}

export const deleteGoogleAnalyticsCookies = () => {
  const domains = buildDeletableDomains(globalThis.location.hostname)
  const names = cookieNames().filter(isGoogleAnalyticsCookie)

  for (const name of names) {
    expireCookie(name, domains)
  }

  return names
}
