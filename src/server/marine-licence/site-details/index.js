import { activityDescriptionRoutes } from '#src/server/marine-licence/site-details/activity-description/index.js'
import { beforeYouStartRoutes } from '#src/server/marine-licence/site-details/before-you-start/index.js'
import { centreCoordinatesRoutes } from '#src/server/marine-licence/site-details/centre-coordinates/index.js'
import { coordinateSystemRoutes } from '#src/server/marine-licence/site-details/coordinate-system/index.js'
import { coordinatesTypeRoutes } from '#src/server/marine-licence/site-details/coordinates-type/index.js'
import { coordinatesEntryRoutes } from '#src/server/marine-licence/site-details/coordinates-entry/index.js'
import { chooseFileTypeRoutes } from '#src/server/marine-licence/site-details/choose-file-type/index.js'
import { fileUploadRoutes } from '#src/server/marine-licence/site-details/file-upload/index.js'
import { siteNameRoutes } from '#src/server/marine-licence/site-details/site-name/index.js'
import { typeOfActivityRoutes } from '#src/server/marine-licence/site-details/type-of-activity/index.js'
import { selectActivityRoutes } from '#src/server/marine-licence/site-details/select-activity/index.js'
import { reviewSiteDetailsRoutes } from '#src/server/marine-licence/site-details/review-site-details/index.js'
import { uploadAndWaitRoutes } from '#src/server/marine-licence/site-details/upload-and-wait/index.js'
import { durationRoutes } from '#src/server/marine-licence/site-details/activity-duration/index.js'

export const siteDetailsRoutes = [
  ...centreCoordinatesRoutes,
  ...activityDescriptionRoutes,
  ...beforeYouStartRoutes,
  ...coordinateSystemRoutes,
  ...coordinatesTypeRoutes,
  ...coordinatesEntryRoutes,
  ...chooseFileTypeRoutes,
  ...fileUploadRoutes,
  ...siteNameRoutes,
  ...reviewSiteDetailsRoutes,
  ...typeOfActivityRoutes,
  ...selectActivityRoutes,
  ...uploadAndWaitRoutes,
  ...durationRoutes
]
