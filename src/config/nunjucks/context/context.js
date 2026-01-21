import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '#src/config/config.js'
import { buildNavigation } from '#src/config/nunjucks/context/build-navigation.js'
import {
  marineLicenseRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { areAnalyticsCookiesAccepted } from '#src/server/common/helpers/cookie-preferences.js'
import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)
let webpackManifest

const hideNavigationRoutes = [
  routes.PROJECT_NAME,
  marineLicenseRoutes.PROJECT_NAME
]

export function context(request) {
  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch {
      request.logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const exemption = getExemptionCache(request)

  const isProjectNameLandingPage =
    hideNavigationRoutes.includes(request.path) && !exemption?.id

  const navigation = hideNavigationRoutes.includes(request.path)
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
