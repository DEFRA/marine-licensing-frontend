import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '#src/config/config.js'
import { buildNavigation } from '#src/config/nunjucks/context/build-navigation.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { areAnalyticsCookiesAccepted } from '#src/server/common/helpers/cookie-preferences.js'
import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)
let webpackManifest

const hideNavigationRoutes = new Set([
  ...Object.values(routes.postLogin),
  routes.IAT_START
])

const hideNavigationRoutesExemptions = new Set([routes.PROJECT_NAME])

const hideNavigationRoutesMarineLicence = new Set([
  marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME
])

const isRouteNavigationHidden = (request) => {
  const { path: pagePath } = request

  try {
    if (pagePath.includes('/exemption')) {
      const exemption = getExemptionCache(request)
      return hideNavigationRoutesExemptions.has(pagePath) && !exemption?.id
    }

    if (pagePath.includes('/marine-licence')) {
      const marineLicence = getMarineLicenceCache(request)
      return (
        hideNavigationRoutesMarineLicence.has(pagePath) && !marineLicence?.id
      )
    }

    return hideNavigationRoutes.has(pagePath)
  } catch {
    return false
  }
}

export function context(request) {
  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch {
      request.logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const isProjectNameLandingPage = isRouteNavigationHidden(request)

  const navigation = isRouteNavigationHidden(request)
    ? []
    : buildNavigation(request)

  const serviceUrl = isProjectNameLandingPage ? '' : '/'
  const analyticsEnabled = areAnalyticsCookiesAccepted(request)
  const isAuthenticated = request?.auth?.isAuthenticated ?? false

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl,
    breadcrumbs: [],
    navigation,
    isAuthenticated,
    analyticsEnabled,
    clarityProjectId: config.get('clarityProjectId'),
    enableBrowserLogging: config.get('enableBrowserLogging'),
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}
