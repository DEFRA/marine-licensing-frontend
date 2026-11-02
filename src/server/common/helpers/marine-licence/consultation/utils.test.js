import { hasResponded } from '#src/server/common/helpers/marine-licence/consultation/utils.js'
import { CONSULTATION_STATUS_CODE } from '#src/server/common/constants/marine-licence.js'

describe('#hasResponded', () => {
  test('Should return true when the consultation status is RESPONDED', () => {
    expect(
      hasResponded({ consultationStatus: CONSULTATION_STATUS_CODE.RESPONDED })
    ).toBe(true)
  })

  test('Should return false when the consultation status is not RESPONDED', () => {
    expect(
      hasResponded({
        consultationStatus: CONSULTATION_STATUS_CODE.RESPONSE_NEEDED
      })
    ).toBe(false)
  })
})
