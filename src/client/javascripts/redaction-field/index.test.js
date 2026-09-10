// @vitest-environment jsdom
import { describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { RedactionField } from './index.js'

vi.mock('govuk-frontend', () => ({
  Component: class {
    constructor($root) {
      this.$root = $root
    }
  }
}))

const buildMarkup = ({
  saveUrl = '/redact',
  publishedText = 'April 2026 to September 2027',
  triggerText = 'Redact'
} = {}) => `
  <div class="app-redaction-field" id="redaction-field-preferredDates" data-module="redaction-field">
    <p class="app-redaction-field__published-text" hidden>
      <span class="app-redaction-field__published-text-value">${publishedText}</span>
    </p>
    <a class="app-redaction-field__trigger" href="#" aria-expanded="false" hidden>${triggerText}</a>
    <div class="app-redaction-field__panel">
      <button type="button" class="app-redaction-field__copy-button" hidden>Copy ***REDACTED***</button>
      <form class="app-redaction-field__form" method="post" action="${saveUrl}">
        <input class="app-redaction-field__input" name="text" value="${publishedText}" />
        <input type="hidden" name="fieldKey" value="preferredDates" />
        <input type="hidden" name="csrfToken" value="test-token" />
        <p class="app-redaction-field__status"></p>
        <button type="submit" class="app-redaction-field__save-button">Save</button>
        <a class="app-redaction-field__cancel-button" href="#" hidden>Cancel</a>
      </form>
    </div>
  </div>
`

const submitForm = ($form) =>
  $form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

const buildPageResponse = (publishedText) => `
  <html lang="en"><body><main>${buildMarkup({
    publishedText,
    triggerText: 'Change'
  })}</main></body></html>
`

const publishedTextOf = () =>
  document.querySelector('.app-redaction-field__published-text-value')
    .textContent

describe('RedactionField', () => {
  let $root
  let component
  let fetchMock

  beforeEach(() => {
    document.body.innerHTML = buildMarkup()
    $root = document.querySelector('.app-redaction-field')
    component = new RedactionField($root)

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(buildPageResponse('Redacted text'))
    })
    vi.stubGlobal('fetch', fetchMock)

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('static moduleName is "redaction-field"', () => {
    expect(RedactionField.moduleName).toBe('redaction-field')
  })

  test('enhances the form into the collapsed view on init', () => {
    expect(component.$redactPanel.hidden).toBe(true)
    expect(component.$trigger.hidden).toBe(false)
    expect(component.$redactedTextContainer.hidden).toBe(false)
    expect(component.$copyButton.hidden).toBe(false)
    expect(component.$cancelButton.hidden).toBe(false)
    expect(document.activeElement).not.toBe(component.$trigger)
  })

  test('reveals the panel and focuses the input on click', () => {
    component.$trigger.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )

    expect(component.$redactPanel.hidden).toBe(false)
    expect(component.$trigger.hidden).toBe(true)
    expect(component.$redactedTextContainer.hidden).toBe(true)
    expect(component.$trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(component.$input)
  })

  test('discards edits and hides the panel on Cancel click', () => {
    component.onRedactClick({ preventDefault: vi.fn() })
    component.$input.value = 'Something typed but not saved'

    component.$cancelButton.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )

    expect(component.$input.value).toBe('April 2026 to September 2027')
    expect(component.$redactPanel.hidden).toBe(true)
    expect(component.$trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(component.$trigger)
  })

  test('copies the placeholder text to the clipboard on Copy click', async () => {
    component.$copyButton.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )
    await Promise.resolve()
    await Promise.resolve()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('***REDACTED***')
    expect(component.$status.textContent).toBe('Copied')
  })

  test('swaps in the re-rendered field from the response on success', async () => {
    component.$input.value = 'Redacted text'

    submitForm(component.$form)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(fetchMock).toHaveBeenCalledWith(
      component.$form.action,
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
    )

    const [, options] = fetchMock.mock.calls[0]
    expect(options.body.toString()).toBe(
      new URLSearchParams({
        text: 'Redacted text',
        fieldKey: 'preferredDates',
        csrfToken: 'test-token'
      }).toString()
    )

    await vi.waitFor(() => expect(publishedTextOf()).toBe('Redacted text'))

    const $swapped = document.querySelector('.app-redaction-field')
    expect($swapped).not.toBe($root)
    expect($root.isConnected).toBe(false)

    const $trigger = $swapped.querySelector('.app-redaction-field__trigger')
    expect($trigger.textContent).toBe('Change')
    expect(document.activeElement).toBe($trigger)
    expect($swapped.querySelector('.app-redaction-field__panel').hidden).toBe(
      true
    )
    expect(
      $swapped.querySelector('.app-redaction-field__status').textContent
    ).toBe('Saved')
  })

  test('announces an error and keeps the panel open when saving fails', async () => {
    fetchMock.mockResolvedValue({ ok: false })
    component.onRedactClick({ preventDefault: vi.fn() })
    component.$input.value = 'Redacted text'

    submitForm(component.$form)
    await vi.waitFor(() => expect(component.$status.textContent).not.toBe(''))

    expect(component.$redactPanel.hidden).toBe(false)
    expect(component.$status.textContent).toBe(
      'Error saving — please try again'
    )
    expect(publishedTextOf()).toBe('April 2026 to September 2027')
    expect(document.querySelector('.app-redaction-field')).toBe($root)
  })

  test('ignores a Cancel click while a save is in flight', async () => {
    let resolveFetch
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    component.onRedactClick({ preventDefault: vi.fn() })
    component.$input.value = 'Redacted text'
    submitForm(component.$form)

    await vi.waitFor(() =>
      expect(component.$cancelButton.getAttribute('aria-disabled')).toBe('true')
    )

    component.$cancelButton.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )

    expect(component.$redactPanel.hidden).toBe(false)
    expect(component.$input.value).toBe('Redacted text')

    resolveFetch({
      ok: true,
      text: () => Promise.resolve(buildPageResponse('Redacted text'))
    })
    await vi.waitFor(() => expect(publishedTextOf()).toBe('Redacted text'))
  })

  test('ignores a second Save submit while a save is already in flight', async () => {
    let resolveFetch
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    submitForm(component.$form)
    submitForm(component.$form)

    resolveFetch({
      ok: true,
      text: () => Promise.resolve(buildPageResponse('Redacted text'))
    })
    await vi.waitFor(() => expect(publishedTextOf()).toBe('Redacted text'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
