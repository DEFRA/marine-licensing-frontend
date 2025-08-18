import { coordinatesTypeRoutes } from '~/src/server/exemption/site-details/coordinates-type/index.js'
import { coordinatesEntryRoutes } from '~/src/server/exemption/site-details/coordinates-entry/index.js'
import { coordinateSystemRoutes } from '~/src/server/exemption/site-details/coordinate-system/index.js'
import { centreCoordinatesRoutes } from '~/src/server/exemption/site-details/centre-coordinates/index.js'
import { widthOfSiteRoutes } from '~/src/server/exemption/site-details/width-of-site/index.js'
import { enterMultipleCoordinatesRoutes } from '~/src/server/exemption/site-details/enter-multiple-coordinates/index.js'
import { reviewSiteDetailsRoutes } from '~/src/server/exemption/site-details/review-site-details/index.js'
import { fileUploadRoutes } from '~/src/server/exemption/site-details/file-upload/index.js'
import { uploadAndWaitRoutes } from '~/src/server/exemption/site-details/upload-and-wait/index.js'
import { chooseFileTypeRoutes } from '~/src/server/exemption/site-details/choose-file-type/index.js'
import { beforeYouStartRoutes } from '~/src/server/exemption/site-details/before-you-start/index.js'

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
  ...reviewSiteDetailsRoutes,
  ...chooseFileTypeRoutes,
  ...fileUploadRoutes,
  ...uploadAndWaitRoutes,
  ...beforeYouStartRoutes
]

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
