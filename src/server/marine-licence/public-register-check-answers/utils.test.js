import { getCheckAnswersSummary } from '#src/server/marine-licence/public-register-check-answers/utils.js'

const WITHHOLD_QUESTION =
  'Do you want to ask us to withhold any information from the public register?'
const APPROVAL_QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'

describe('getCheckAnswersSummary', () => {
  test('commercial confidentiality has no approval row', () => {
    expect(
      getCheckAnswersSummary({
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality',
        reason: 'Pricing details'
      })
    ).toEqual({
      withhold: {
        key: WITHHOLD_QUESTION,
        value: 'Yes – Commercial or industrial confidentiality reasons'
      },
      approval: null,
      reason: {
        key: 'What you want withheld and why',
        value: 'Pricing details'
      }
    })
  })

  test('national security with approval shows what is withheld', () => {
    expect(
      getCheckAnswersSummary({
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity',
        nationalSecurityApproval: 'yes',
        reason: 'Details of the berth'
      })
    ).toEqual({
      withhold: {
        key: WITHHOLD_QUESTION,
        value: 'Yes – National security reasons'
      },
      approval: { key: APPROVAL_QUESTION, value: 'Yes' },
      reason: { key: 'What you want withheld', value: 'Details of the berth' }
    })
  })

  test('national security without approval has no reason row', () => {
    expect(
      getCheckAnswersSummary({
        withholdConsent: 'yes',
        withholdReason: 'nationalSecurity',
        nationalSecurityApproval: 'no'
      })
    ).toEqual({
      withhold: {
        key: WITHHOLD_QUESTION,
        value: 'Yes – National security reasons'
      },
      approval: {
        key: APPROVAL_QUESTION,
        value:
          'No – If you get approval later, you can come back and change your answer before you submit your application.'
      },
      reason: null
    })
  })
})
