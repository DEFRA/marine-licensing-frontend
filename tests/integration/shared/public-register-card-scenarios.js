const WITHHOLD_QUESTION =
  'Do you want to ask us to withhold any information from the public register?'
const APPROVAL_QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'

export const publicRegisterCardScenarios = [
  {
    name: 'not withholding',
    publicRegister: { withholdConsent: 'no' },
    expectedRows: [[WITHHOLD_QUESTION, 'No']]
  },
  {
    name: 'withholding for commercial confidentiality',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'commercialConfidentiality',
      reason: 'Trestle method'
    },
    expectedRows: [
      [
        WITHHOLD_QUESTION,
        'Yes – Commercial or industrial confidentiality reasons'
      ],
      ['What you want withheld and why', 'Trestle method']
    ]
  },
  {
    name: 'withholding for national security with approval',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity',
      nationalSecurityApproval: 'yes',
      reason: 'Radar sites'
    },
    expectedRows: [
      [WITHHOLD_QUESTION, 'Yes – National security reasons'],
      [APPROVAL_QUESTION, 'Yes'],
      ['What you want withheld', 'Radar sites']
    ]
  },
  {
    name: 'withholding for national security without approval',
    publicRegister: {
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity',
      nationalSecurityApproval: 'no'
    },
    expectedRows: [
      [WITHHOLD_QUESTION, 'Yes – National security reasons'],
      [
        APPROVAL_QUESTION,
        'No – Without approval, we cannot withhold information for national security reasons. We will publish it with the rest of your application. If you get approval before you submit, you can come back and change your answer.'
      ]
    ]
  }
]

export const getPublicRegisterCardRows = (document) =>
  Array.from(
    document.querySelectorAll('#public-register-card .govuk-summary-list__row'),
    (row) => [
      row.querySelector('.govuk-summary-list__key').textContent.trim(),
      row.querySelector('.govuk-summary-list__value').textContent.trim()
    ]
  )
