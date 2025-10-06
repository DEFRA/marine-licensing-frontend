import { coordinatesTypeRoutes } from '#src/server/exemption/site-details/coordinates-type/index.js'
import { coordinatesEntryRoutes } from '#src/server/exemption/site-details/coordinates-entry/index.js'
import { multipleSitesChoiceRoutes } from '#src/server/exemption/site-details/multiple-sites-question/index.js'
import { siteNameRoutes } from '#src/server/exemption/site-details/site-name/index.js'
import { sameActivityDatesRoutes } from '#src/server/exemption/site-details/same-activity-dates/index.js'
import { sameActivityDescriptionRoutes } from '#src/server/exemption/site-details/same-activity-description/index.js'
import { coordinateSystemRoutes } from '#src/server/exemption/site-details/coordinate-system/index.js'
import { centreCoordinatesRoutes } from '#src/server/exemption/site-details/centre-coordinates/index.js'
import { widthOfSiteRoutes } from '#src/server/exemption/site-details/width-of-site/index.js'
import { enterMultipleCoordinatesRoutes } from '#src/server/exemption/site-details/enter-multiple-coordinates/index.js'
import { reviewSiteDetailsRoutes } from '#src/server/exemption/site-details/review-site-details/index.js'
import { fileUploadRoutes } from '#src/server/exemption/site-details/file-upload/index.js'
import { uploadAndWaitRoutes } from '#src/server/exemption/site-details/upload-and-wait/index.js'
import { chooseFileTypeRoutes } from '#src/server/exemption/site-details/choose-file-type/index.js'
import { beforeYouStartRoutes } from '#src/server/exemption/site-details/before-you-start/index.js'
import { deleteSiteRoutes } from '#src/server/exemption/site-details/delete-site/index.js'
export const siteDetailsRoutes = [
  ...coordinatesTypeRoutes,
  ...coordinatesEntryRoutes,
  ...multipleSitesChoiceRoutes,
  ...siteNameRoutes,
  ...sameActivityDatesRoutes,
  ...sameActivityDescriptionRoutes,
  ...coordinateSystemRoutes,
  ...centreCoordinatesRoutes,
  ...widthOfSiteRoutes,
  ...enterMultipleCoordinatesRoutes,
  ...reviewSiteDetailsRoutes,
  ...chooseFileTypeRoutes,
  ...fileUploadRoutes,
  ...uploadAndWaitRoutes,
  ...beforeYouStartRoutes,
  ...deleteSiteRoutes
]
