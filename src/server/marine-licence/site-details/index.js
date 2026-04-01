import { beforeYouStartRoutes } from '#src/server/marine-licence/site-details/before-you-start/index.js'
import { coordinatesTypeRoutes } from '#src/server/marine-licence/site-details/coordinates-type/index.js'
import { chooseFileTypeRoutes } from '#src/server/marine-licence/site-details/choose-file-type/index.js'
import { fileUploadRoutes } from '#src/server/marine-licence/site-details/file-upload/index.js'
import { uploadAndWaitRoutes } from '#src/server/marine-licence/site-details/upload-and-wait/index.js'

export const siteDetailsRoutes = [
  ...beforeYouStartRoutes,
  ...coordinatesTypeRoutes,
  ...chooseFileTypeRoutes,
  ...fileUploadRoutes,
  ...uploadAndWaitRoutes
]
