import {
  toPublicRegister,
  toPublicRegisterFormValues
} from '#src/server/marine-licence/public-register/utils.js'

describe('#toPublicRegister', () => {
  test('stores a withholding request as consent no, keeping the reason', () => {
    expect(toPublicRegister({ consent: 'yes', reason: 'Some reason' })).toEqual(
      {
        consent: 'no',
        reason: 'Some reason'
      }
    )
  })

  test('stores no withholding request as consent yes, dropping the reason', () => {
    expect(toPublicRegister({ consent: 'no', reason: 'Some reason' })).toEqual({
      consent: 'yes'
    })
  })
})

describe('#toPublicRegisterFormValues', () => {
  test('shows Yes when the stored record withholds information', () => {
    expect(
      toPublicRegisterFormValues({ consent: 'no', reason: 'Some reason' })
    ).toEqual({ consent: 'yes', reason: 'Some reason' })
  })

  test('shows No when the stored record consents to publication', () => {
    expect(toPublicRegisterFormValues({ consent: 'yes' })).toEqual({
      consent: 'no'
    })
  })

  test.each([undefined, {}])(
    'returns an empty form when nothing is stored (%s)',
    (publicRegister) => {
      expect(toPublicRegisterFormValues(publicRegister)).toEqual({})
    }
  )
})
