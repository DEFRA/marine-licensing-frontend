import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Redaction Field Component', () => {
  const baseParams = {
    fieldId: 'preferredDates',
    label: 'preferred start and end dates of the licence',
    originalText: 'April 2026 to September 2027',
    publishedText: 'April 2026 to September 2027',
    redactions: {},
    isRedacted: false,
    saveUrl: '/view-marine-licence-details/test-id/redact',
    csrfToken: 'test-crumb-token'
  }

  test('displays the correct markup text for non redacted', () => {
    const $component = renderComponent(
      'marine-licence/redaction-field',
      baseParams
    )

    const $root = $component('.app-redaction-field')
    expect($root.attr('data-module')).toBe('redaction-field')
    expect($root.attr('id')).toBe('redaction-field-preferredDates')

    expect($component('.app-redaction-field__trigger').text()).toContain(
      'Redact'
    )

    expect(
      $component('.app-redaction-field__published-text-value').text().trim()
    ).toBe('April 2026 to September 2027')

    const $trigger = $component('.app-redaction-field__trigger')
    expect($trigger).toHaveLength(1)
    expect($trigger.attr('aria-controls')).toBe(
      'redaction-panel-preferredDates'
    )
    expect($trigger.attr('aria-expanded')).toBe('false')

    const $panel = $component('#redaction-panel-preferredDates')
    expect($panel).toHaveLength(1)
    expect($panel.attr('hidden')).toBeUndefined()

    expect($component.html()).toContain("Applicant's text")

    const $form = $component('.app-redaction-field__form')
    expect($form.attr('method')).toBe('post')
    expect($form.attr('action')).toBe(
      '/view-marine-licence-details/test-id/redact'
    )

    expect($component('input[name="csrfToken"]').attr('value')).toBe(
      'test-crumb-token'
    )
  })

  test('displays the redacted state when a redaction exists', () => {
    const $component = renderComponent('marine-licence/redaction-field', {
      ...baseParams,
      isRedacted: true,
      redactions: { redactedTextValue: 'Redacted preferred dates' },
      publishedText:
        'Redacted preferred dates <span class="app-redaction-label">***REDACTED***</span>'
    })

    expect($component('.app-redaction-field__trigger').text()).toContain(
      'Change redaction'
    )

    const summary = $component('.app-redaction-field__published-text').text()
    expect(summary).toContain("Applicant's text")
    expect(summary).toContain('April 2026 to September 2027')
    expect(summary).toContain('Text to be published')
    expect(summary).toContain('Redacted preferred dates')

    expect($component('.app-redaction-label').text()).toBe('***REDACTED***')

    expect($component('.app-redaction-field__input').attr('value')).toBe(
      'Redacted preferred dates'
    )
  })
})
