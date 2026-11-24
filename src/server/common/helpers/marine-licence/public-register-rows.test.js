import { buildPublicRegisterRows } from '#src/server/common/helpers/marine-licence/public-register-rows.js'

const WITHHOLD_QUESTION =
  'Do you want to ask us to withhold any information from the public register?'
const APPROVAL_QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'
const APPROVAL_NO_ANSWER =
  'No – Without approval, we cannot withhold information for national security reasons. We will publish it with the rest of your application. If you get approval before you submit, you can come back and change your answer.'
const COMMERCIAL_REASON_LABEL = 'What you want withheld and why'
const NATIONAL_SECURITY_REASON_LABEL = 'What you want withheld'
const NO_BORDER = 'govuk-summary-list__row--no-border'

const commercial = {
  withholdConsent: 'yes',
  withholdReason: 'commercialConfidentiality',
  reason: 'Trestle method'
}

const nationalSecurity = (nationalSecurityApproval, reason) => ({
  withholdConsent: 'yes',
  withholdReason: 'nationalSecurity',
  nationalSecurityApproval,
  ...(reason && { reason })
})

describe('buildPublicRegisterRows', () => {
  test('"No" shows only the withhold row', () => {
    expect(buildPublicRegisterRows({ withholdConsent: 'no' })).toEqual([
      { key: { text: WITHHOLD_QUESTION }, value: { text: 'No' } }
    ])
  })

  test('commercial confidentiality shows the reason and "what and why"', () => {
    expect(buildPublicRegisterRows(commercial)).toEqual([
      {
        key: { text: WITHHOLD_QUESTION },
        value: {
          text: 'Yes – Commercial or industrial confidentiality reasons'
        }
      },
      {
        key: { text: COMMERCIAL_REASON_LABEL },
        value: { html: 'Trestle method' }
      }
    ])
  })

  test('national security with approval shows approval and "what you want withheld" with no border between them', () => {
    expect(
      buildPublicRegisterRows(nationalSecurity('yes', 'Radar sites'))
    ).toEqual([
      {
        key: { text: WITHHOLD_QUESTION },
        value: { text: 'Yes – National security reasons' }
      },
      {
        key: { text: APPROVAL_QUESTION },
        value: { text: 'Yes' },
        classes: NO_BORDER
      },
      {
        key: { text: NATIONAL_SECURITY_REASON_LABEL },
        value: { html: 'Radar sites' }
      }
    ])
  })

  test('national security without approval shows the explanation and no reason row', () => {
    expect(buildPublicRegisterRows(nationalSecurity('no'))).toEqual([
      {
        key: { text: WITHHOLD_QUESTION },
        value: { text: 'Yes – National security reasons' }
      },
      {
        key: { text: APPROVAL_QUESTION },
        value: { text: APPROVAL_NO_ANSWER }
      }
    ])
  })

  describe('stale answers', () => {
    test('"No" ignores a leftover reason and withhold reason', () => {
      expect(
        buildPublicRegisterRows({
          withholdConsent: 'no',
          withholdReason: 'commercialConfidentiality',
          reason: 'Old text'
        })
      ).toHaveLength(1)
    })

    test('national security without approval ignores a leftover reason', () => {
      const rows = buildPublicRegisterRows(nationalSecurity('no', 'Old text'))

      expect(rows.map((row) => row.key.text)).toEqual([
        WITHHOLD_QUESTION,
        APPROVAL_QUESTION
      ])
      expect(rows[1].classes).toBeUndefined()
    })

    test('commercial confidentiality ignores a leftover approval answer', () => {
      const rows = buildPublicRegisterRows({
        ...commercial,
        nationalSecurityApproval: 'yes'
      })

      expect(rows.map((row) => row.key.text)).toEqual([
        WITHHOLD_QUESTION,
        COMMERCIAL_REASON_LABEL
      ])
    })
  })

  test('escapes the user text and keeps line breaks', () => {
    const rows = buildPublicRegisterRows({
      ...commercial,
      reason: '<script>alert(1)</script>\nSecond line'
    })

    expect(rows[1].value.html).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;<br>Second line'
    )
  })

  test.each([
    { name: 'nothing is stored', publicRegister: undefined },
    { name: 'a record predates the rename', publicRegister: { consent: 'yes' } }
  ])(
    'marks the withhold row incomplete when $name',
    ({ publicRegister }) => {
      expect(buildPublicRegisterRows(publicRegister)).toEqual([
        {
          key: { text: WITHHOLD_QUESTION },
          value: { text: '' },
          isIncomplete: true
        }
      ])
    }
  )

  describe('withheld before a reason type was asked for', () => {
    test('shows "Yes" and the details as "what and why"', () => {
      expect(
        buildPublicRegisterRows({ withholdConsent: 'yes', reason: 'Pricing' })
      ).toEqual([
        { key: { text: WITHHOLD_QUESTION }, value: { text: 'Yes' } },
        {
          key: { text: COMMERCIAL_REASON_LABEL },
          value: { html: 'Pricing' }
        }
      ])
    })

    test('shows only "Yes" when there are no details', () => {
      expect(buildPublicRegisterRows({ withholdConsent: 'yes' })).toEqual([
        { key: { text: WITHHOLD_QUESTION }, value: { text: 'Yes' } }
      ])
    })
  })
})
