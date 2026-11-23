import { getCheckAnswersSummary } from '#src/server/marine-licence/public-register/check-answers/utils.js'

describe('getCheckAnswersSummary', () => {
  test('national security without approval ignores a stray reason', () => {
    expect(
      getCheckAnswersSummary({
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity',
        nationalSecurityApproval: 'no',
        reason: 'Stale details'
      }).reason
    ).toBeNull()
  })
})
