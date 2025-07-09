import { coordinatesTypeRoutes } from '~/src/server/exemption/site-details/coordinates-type/index.js'
import { coordinatesEntryRoutes } from '~/src/server/exemption/site-details/coordinates-entry/index.js'
import { coordinateSystemRoutes } from '~/src/server/exemption/site-details/coordinate-system/index.js'
import { centreCoordinatesRoutes } from '~/src/server/exemption/site-details/centre-coordinates/index.js'
import { widthOfSiteRoutes } from '~/src/server/exemption/site-details/width-of-site/index.js'
import { enterMultipleCoordinatesRoutes } from '~/src/server/exemption/site-details/enter-multiple-coordinates/index.js'
import { reviewSiteDetailsRoutes } from '~/src/server/exemption/site-details/review-site-details/index.js'

/**
 * Sets up the routes used in the Site Details section
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const siteDetailsRoutes = [
  ...coordinatesTypeRoutes,
  ...coordinatesEntryRoutes,
  ...coordinateSystemRoutes,
  ...centreCoordinatesRoutes,
  ...widthOfSiteRoutes,
  ...enterMultipleCoordinatesRoutes,
  ...reviewSiteDetailsRoutes
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
