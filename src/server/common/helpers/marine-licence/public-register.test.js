import {
  getNationalSecurityAnswers,
  isNationalSecurity
} from './public-register.js'

describe('isNationalSecurity', () => {
  test.each([
    {
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity'
      },
      expected: true
    },
    {
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality'
      },
      expected: false
    },
    {
      publicRegister: {
        withholdConsent: 'no',
        withholdReason: 'nationalSecurity'
      },
      expected: false
    },
    { publicRegister: undefined, expected: false }
  ])(
    'returns $expected for $publicRegister',
    ({ publicRegister, expected }) => {
      expect(isNationalSecurity(publicRegister)).toBe(expected)
    }
  )
})

describe('getNationalSecurityAnswers', () => {
  test('returns only the national security answers', () => {
    expect(
      getNationalSecurityAnswers({
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity',
        nationalSecurityApproval: 'yes',
        reason: 'Details'
      })
    ).toEqual({ nationalSecurityApproval: 'yes', reason: 'Details' })
  })

  test('returns undefined answers when nothing is saved', () => {
    expect(getNationalSecurityAnswers(undefined)).toEqual({
      nationalSecurityApproval: undefined,
      reason: undefined
    })
  })
})
