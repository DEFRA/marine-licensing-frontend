import { coordinatesTypeRoutes } from '~/src/server/exemption/site-details/coordinates-type/index.js'

/**
 * Sets up the routes used in the Site Details section
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const siteDetailsRoutes = [...coordinatesTypeRoutes]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
