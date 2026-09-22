import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Withhold Document Component', () => {
  const baseParams = {
    fieldId: 'random-document',
    saveUrl: '/view-marine-licence-details/test-id/redact',
    csrfToken: 'test-crumb-token'
  }

  test('displays the correct markup text for non redacted', () => {
    const $component = renderComponent(
      'marine-licence/withhold-document',
      baseParams
    )

    expect($component('.app-withhold__button').text()).toContain(
      'Withhold document'
    )
  })

  test('displays the redacted state when a redaction exists', () => {
    const $component = renderComponent('marine-licence/withhold-document', {
      ...baseParams,
      isWithheld: true
    })

    expect($component('.app-withhold__button').text()).toContain(
      'Remove redaction'
    )

    const summary = $component('.app-redaction-inset').text()
    expect(summary).toContain(
      'This document will not be published on the public register.'
    )
    expect(summary).toContain('***REDACTED***')
  })
})
