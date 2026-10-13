import { siteNoticeRoutes } from '#src/server/marine-licence/site-notice/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const expectedRoutes = [
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY],
  ['POST', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME],
  ['POST', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED],
  ['POST', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PHOTO_UPLOAD_AND_WAIT],
  ['POST', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_ADD_EVIDENCE],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DELETE_LOCATION],
  ['POST', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DELETE_LOCATION]
]

describe('#siteNoticeRoutes', () => {
  test('should export an array of routes', () => {
    expect(Array.isArray(siteNoticeRoutes)).toBe(true)
    expect(siteNoticeRoutes).toHaveLength(expectedRoutes.length)
  })

  test.each(expectedRoutes)('should have a %s route for %s', (method, path) => {
    const siteNoticeRoute = siteNoticeRoutes.find(
      (route) =>
        route.method === method &&
        [path, `${path}/{marineLicenceId}`].includes(route.path)
    )

    expect(siteNoticeRoute).toBeDefined()
  })
})
