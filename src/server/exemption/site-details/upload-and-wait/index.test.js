import { uploadAndWaitRoutes } from '#src/server/exemption/site-details/upload-and-wait/index.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('uploadAndWaitRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(uploadAndWaitRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: routes.UPLOAD_AND_WAIT
      })
    )
  })
})
