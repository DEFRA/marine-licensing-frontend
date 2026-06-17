import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { waterFrameworkDirectiveUploadAndWaitRoutes } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/index.js'

describe('waterFrameworkDirectiveUploadAndWaitRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkDirectiveUploadAndWaitRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT
      })
    )
  })
})
