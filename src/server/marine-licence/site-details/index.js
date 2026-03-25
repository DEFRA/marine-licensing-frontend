import { beforeYouStartRoutes } from '#src/server/marine-licence/site-details/before-you-start/index.js'
import { coordinatesTypeRoutes } from '#src/server/marine-licence/site-details/coordinates-type/index.js'
import { chooseFileTypeRoutes } from '#src/server/marine-licence/site-details/choose-file-type/index.js'

export const siteDetailsRoutes = [
  ...beforeYouStartRoutes,
  ...coordinatesTypeRoutes,
  ...chooseFileTypeRoutes
]
