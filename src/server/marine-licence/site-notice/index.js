import { siteNoticeDisplayRoutes } from '#src/server/marine-licence/site-notice/display/index.js'
import { siteNoticeLocationNameRoutes } from '#src/server/marine-licence/site-notice/location-name/index.js'

export const siteNoticeRoutes = [
  ...siteNoticeDisplayRoutes,
  ...siteNoticeLocationNameRoutes
]
