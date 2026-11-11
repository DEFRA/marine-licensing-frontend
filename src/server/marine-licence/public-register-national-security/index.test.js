import { publicRegisterNationalSecurityRoutes } from '#src/server/marine-licence/public-register-national-security/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('publicRegisterNationalSecurityRoutes', () => {
  test.each([
    [0, 'GET'],
    [1, 'POST']
  ])('route %i is a %s route', (index, method) => {
    expect(publicRegisterNationalSecurityRoutes[index]).toEqual(
      expect.objectContaining({
        method,
        path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
      })
    )
  })
})
