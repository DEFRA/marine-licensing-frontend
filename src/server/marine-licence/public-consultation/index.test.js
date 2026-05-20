import { publicConsultationRoutes } from '#src/server/marine-licence/public-consultation/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('publicConsultationRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(publicConsultationRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(publicConsultationRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION
      })
    )
  })
})
