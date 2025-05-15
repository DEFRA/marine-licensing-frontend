import { provideCoordinatesChoiceRoutes } from '~/src/server/exemption/site-details/provide-coordinates-choice/index.js'

/**
 * Sets up the routes used in the Site Details section
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const siteDetailsRoutes = [...provideCoordinatesChoiceRoutes]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
