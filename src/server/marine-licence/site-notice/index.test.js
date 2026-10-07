import { siteNoticeRoutes } from '#src/server/marine-licence/site-notice/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const expectedRoutes = [
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY],
  ['GET', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME],
  ['POST', marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME]
]

describe('#siteNoticeRoutes', () => {
  test('should export an array of routes', () => {
    expect(Array.isArray(siteNoticeRoutes)).toBe(true)
    expect(siteNoticeRoutes).toHaveLength(expectedRoutes.length)
  })

  test.each(expectedRoutes)('should have a %s route for %s', (method, path) => {
    const siteNoticeRoute = siteNoticeRoutes.find(
      (route) =>
        route.method === method && route.path === `${path}/{marineLicenceId}`
    )

    expect(siteNoticeRoute).toBeDefined()
  })
})
