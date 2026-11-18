import { publicRegisterCheckAnswersRoutes } from '#src/server/marine-licence/public-register-check-answers/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('publicRegisterCheckAnswersRoutes', () => {
  test.each([
    [0, 'GET'],
    [1, 'POST']
  ])('route %i is a %s to the check answers page', (index, method) => {
    expect(publicRegisterCheckAnswersRoutes[index]).toEqual(
      expect.objectContaining({
        method,
        path: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS
      })
    )
  })
})
