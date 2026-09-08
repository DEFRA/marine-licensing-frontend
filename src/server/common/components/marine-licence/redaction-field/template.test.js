import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Redaction Field Component', () => {
  const baseParams = {
    fieldId: 'preferredDates',
    label: 'preferred start and end dates of the licence',
    originalText: 'April 2026 to September 2027',
    publishedText: 'April 2026 to September 2027',
    isRedacted: false,
    saveUrl: '/view-marine-licence-details/test-id/redact',
    csrfToken: 'test-crumb-token'
  }

  test('displays the correct markup text', () => {
    const $component = renderComponent(
      'marine-licence/redaction-field',
      baseParams
    )

    const $root = $component('.app-redaction-field')
    expect($root.attr('data-module')).toBe('redaction-field')

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
})
