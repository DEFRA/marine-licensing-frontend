import { waterFrameworkFileUploadRoutes } from '#src/server/marine-licence/water-framework-directive/file-upload/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('waterFrameworkFileUploadRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkFileUploadRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
      })
    )
  })
})
