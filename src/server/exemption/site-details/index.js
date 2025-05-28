import { coordinatesTypeRoutes } from '~/src/server/exemption/site-details/coordinates-type/index.js'
import { coordinatesEntryRoutes } from '~/src/server/exemption/site-details/coordinates-entry/index.js'
import { coordinateSystemRoutes } from '~/src/server/exemption/site-details/coordinate-system/index.js'
import { centerCoordinatesRoutes } from '~/src/server/exemption/site-details/center-coordinates/index.js'

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
  ...centerCoordinatesRoutes
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
