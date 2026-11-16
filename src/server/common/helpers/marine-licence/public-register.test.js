import {
  getNationalSecurityAnswers,
  getReasonPageLinks,
  isCommercialConfidentiality,
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

describe('isCommercialConfidentiality', () => {
  test.each([
    {
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality'
      },
      expected: true
    },
    {
      publicRegister: {
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity'
      },
      expected: false
    },
    {
      publicRegister: {
        withholdConsent: 'no',
        withholdReason: 'commercialConfidentiality'
      },
      expected: false
    },
    { publicRegister: undefined, expected: false }
  ])(
    'returns $expected for $publicRegister',
    ({ publicRegister, expected }) => {
      expect(isCommercialConfidentiality(publicRegister)).toBe(expected)
    }
  )
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

describe('getReasonPageLinks', () => {
  test('goes Back to the withholding information page and Cancel to the task list', () => {
    expect(getReasonPageLinks({ query: {} })).toEqual({
      backLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    })
  })

  test('keeps check your answers on Back only', () => {
    expect(
      getReasonPageLinks({ query: { from: 'check-your-answers' } })
    ).toEqual({
      backLink: `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`,
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    })
  })
})
