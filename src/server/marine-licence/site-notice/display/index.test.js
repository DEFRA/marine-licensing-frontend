import { siteNoticeDisplayRoutes } from '#src/server/marine-licence/site-notice/display/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('#siteNoticeDisplayRoutes', () => {
  test('should export an array of routes', () => {
    expect(Array.isArray(siteNoticeDisplayRoutes)).toBe(true)
  })

  test('should have a GET route for the site notice display page', () => {
    const getRoute = siteNoticeDisplayRoutes.find(
      (route) => route.method === 'GET'
    )

    expect(getRoute).toBeDefined()
    expect(getRoute.path).toBe(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY +
        `/{marineLicenceId}`
    )
  })
})
