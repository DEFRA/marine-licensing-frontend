import { coordinatesTypeRoutes } from '~/src/server/exemption/site-details/coordinates-type/index.js'
import { coordinatesEntryRoutes } from '~/src/server/exemption/site-details/coordinates-entry/index.js'
import { coordinateSystemRoutes } from '~/src/server/exemption/site-details/coordinate-system/index.js'
import { centreCoordinatesRoutes } from '~/src/server/exemption/site-details/centre-coordinates/index.js'

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
  ...centreCoordinatesRoutes
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
