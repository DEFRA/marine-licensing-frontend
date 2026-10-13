import { siteNoticeDisplayRoutes } from '#src/server/marine-licence/site-notice/display/index.js'
import { siteNoticeLocationNameRoutes } from '#src/server/marine-licence/site-notice/location-name/index.js'
import { siteNoticeDateDisplayedRoutes } from '#src/server/marine-licence/site-notice/date-displayed/index.js'
import { siteNoticeCloseUpPhotoRoutes } from '#src/server/marine-licence/site-notice/close-up-photo/index.js'
import { siteNoticePositionPhotoRoutes } from '#src/server/marine-licence/site-notice/position-photo/index.js'
import { siteNoticePhotoUploadAndWaitRoutes } from '#src/server/marine-licence/site-notice/photo-upload-and-wait/index.js'
import { siteNoticeDeleteLocationRoutes } from '#src/server/marine-licence/site-notice/delete-location/index.js'

export const siteNoticeRoutes = [
  ...siteNoticeDisplayRoutes,
  ...siteNoticeLocationNameRoutes,
  ...siteNoticeDateDisplayedRoutes,
  ...siteNoticeCloseUpPhotoRoutes,
  ...siteNoticePositionPhotoRoutes,
  ...siteNoticePhotoUploadAndWaitRoutes,
  ...siteNoticeDeleteLocationRoutes
]
