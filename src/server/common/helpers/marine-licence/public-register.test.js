import {
  getCheckAnswersRedirect,
  getNationalSecurityAnswers,
  getReasonPage,
  isNationalSecurity,
  keepReasonAnswers
} from './public-register.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

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

describe('keepReasonAnswers', () => {
  const commercial = {
    withholdConsent: 'yes',
    withholdReason: 'commercialConfidentiality'
  }
  const nationalSecurity = {
    withholdConsent: 'yes',
    withholdReason: 'nationalSecurity'
  }

  test('keeps the commercial reason when commercial is still the reason', () => {
    expect(
      keepReasonAnswers(commercial, { ...commercial, reason: 'Pricing' })
    ).toEqual({ ...commercial, reason: 'Pricing' })
  })

  test('keeps the national security answers when national security is still the reason', () => {
    const saved = {
      ...nationalSecurity,
      nationalSecurityApproval: 'yes',
      reason: 'Berth'
    }
    expect(keepReasonAnswers(nationalSecurity, saved)).toEqual(saved)
  })

  test.each([
    {
      name: 'the reason changes',
      publicRegister: nationalSecurity,
      existing: { ...commercial, reason: 'Pricing' }
    },
    {
      name: 'the answer changes to no',
      publicRegister: { withholdConsent: 'no' },
      existing: { ...commercial, reason: 'Pricing' }
    },
    {
      name: 'nothing was saved',
      publicRegister: commercial,
      existing: undefined
    }
  ])('drops saved answers when $name', ({ publicRegister, existing }) => {
    expect(keepReasonAnswers(publicRegister, existing)).toEqual(publicRegister)
  })
})

describe('getReasonPage', () => {
  test.each([
    {
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity'
      },
      expected:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
    },
    {
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality'
      },
      expected:
        marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY
    },
    { publicRegister: { withholdConsent: 'no' }, expected: null },
    { publicRegister: undefined, expected: null }
  ])(
    'returns $expected for $publicRegister',
    ({ publicRegister, expected }) => {
      expect(getReasonPage(publicRegister)).toBe(expected)
    }
  )
})

describe('getCheckAnswersRedirect', () => {
  const nationalSecurity = {
    withholdConsent: 'yes',
    withholdReason: 'nationalSecurity'
  }
  const commercial = {
    withholdConsent: 'yes',
    withholdReason: 'commercialConfidentiality'
  }

  test.each([
    { name: 'there are no answers', publicRegister: undefined },
    { name: 'the answer is no', publicRegister: { withholdConsent: 'no' } },
    {
      name: 'yes was chosen without a reason',
      publicRegister: { withholdConsent: 'yes' }
    }
  ])('returns the first page when $name', ({ publicRegister }) => {
    expect(getCheckAnswersRedirect(publicRegister)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
    )
  })

  test('returns the national security page when approval is not answered', () => {
    expect(getCheckAnswersRedirect(nationalSecurity)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_NATIONAL_SECURITY
    )
  })

  test('returns the commercial page when the reason is missing', () => {
    expect(getCheckAnswersRedirect(commercial)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY
    )
  })

  test.each([
    { ...nationalSecurity, nationalSecurityApproval: 'no' },
    { ...nationalSecurity, nationalSecurityApproval: 'yes', reason: 'Berth' },
    { ...commercial, reason: 'Pricing details' }
  ])('returns null when the answers are complete: %o', (publicRegister) => {
    expect(getCheckAnswersRedirect(publicRegister)).toBeNull()
  })
})
