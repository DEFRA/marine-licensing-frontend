import { toPublicRegister } from '#src/server/marine-licence/public-register/utils.js'

describe('#toPublicRegister', () => {
  test('keeps the reason when information is withheld', () => {
    expect(toPublicRegister({ consent: 'yes', reason: 'Some reason' })).toEqual(
      { consent: 'yes', reason: 'Some reason' }
    )
  })

  test('drops the reason when no information is withheld', () => {
    expect(toPublicRegister({ consent: 'no', reason: 'Some reason' })).toEqual({
      consent: 'no'
    })
  })
})
