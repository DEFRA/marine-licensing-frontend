import { deleteAnalyticsCookies } from './analytics-cookies.js'

const hasRejectedAnalytics = () =>
  globalThis.COOKIE_PREFERENCES_SET === true &&
  globalThis.ANALYTICS_ENABLED === false

const reloadPage = () => globalThis.location.reload()

// Runs on every page. Deletes Google Analytics and Clarity cookies once the user has rejected analytics
// (never while undecided, so a sibling service's consent is respected) and re-renders a page
// restored from the back/forward cache so it reflects the current consent state.
export const initCookieConsent = ({ reload = reloadPage } = {}) => {
  if (hasRejectedAnalytics()) {
    deleteAnalyticsCookies()
  }

  globalThis.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      reload()
    }
  })
}
