import { withholdingNotificationRoutes } from '#src/server/marine-licence/withholding-notification/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('withholdingNotificationRoutes', () => {
  test('registers the detail page and its mark as read submission', () => {
    expect(
      withholdingNotificationRoutes.map(({ method, path }) => ({
        method,
        path
      }))
    ).toEqual([
      {
        method: 'GET',
        path: `${marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION}/{marineLicenceId}`
      },
      {
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION
      }
    ])
  })
})
