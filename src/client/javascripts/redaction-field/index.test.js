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

const buildMarkup = ({ saveUrl = '/redact' } = {}) => `
  <div class="app-redaction-field" data-module="redaction-field">
    <p class="app-redaction-field__published-text" hidden>
      <span class="app-redaction-field__published-text-value">April 2026 to September 2027</span>
    </p>
    <a class="app-redaction-field__trigger" href="#" aria-expanded="false" hidden>Redact</a>
    <div class="app-redaction-field__panel">
      <button type="button" class="app-redaction-field__copy-button" hidden>Copy ***REDACTED***</button>
      <form class="app-redaction-field__form" method="post" action="${saveUrl}">
        <input class="app-redaction-field__input" name="text" value="April 2026 to September 2027" />
        <input type="hidden" name="fieldKey" value="preferredDates" />
        <input type="hidden" name="csrfToken" value="test-token" />
        <p class="app-redaction-field__status"></p>
        <button type="submit" class="app-redaction-field__save-button">Save</button>
        <button type="button" class="app-redaction-field__cancel-button" hidden>Cancel</button>
      </form>
    </div>
  </div>
`

const submitForm = ($form) =>
  $form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

describe('RedactionField', () => {
  let $root
  let component
  let fetchMock

  beforeEach(() => {
    document.body.innerHTML = buildMarkup()
    $root = document.querySelector('.app-redaction-field')
    component = new RedactionField($root)

    fetchMock = vi.fn().mockResolvedValue({ ok: true })
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
    expect(component.$panel.hidden).toBe(true)
    expect(component.$trigger.hidden).toBe(false)
    expect(component.$publishedTextContainer.hidden).toBe(false)
    expect(component.$copyButton.hidden).toBe(false)
    expect(component.$cancelButton.hidden).toBe(false)
    expect(document.activeElement).not.toBe(component.$trigger)
  })

  test('reveals the panel and focuses the input on click', () => {
    component.$trigger.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    )

    expect(component.$panel.hidden).toBe(false)
    expect(component.$trigger.hidden).toBe(true)
    expect(component.$publishedTextContainer.hidden).toBe(true)
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
    expect(component.$panel.hidden).toBe(true)
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

  test('saves the edited text and updates the published text on success', async () => {
    component.$input.value = 'Redacted text'

    submitForm(component.$form)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(fetchMock).toHaveBeenCalledWith(
      component.$form.action,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          text: 'Redacted text',
          fieldKey: 'preferredDates',
          csrfToken: 'test-token'
        })
      })
    )
    await vi.waitFor(() =>
      expect(component.$publishedTextValue.textContent).toBe('Redacted text')
    )
    expect(component.$panel.hidden).toBe(true)
    expect(component.$status.textContent).toBe('Saved')
  })

  test('shows an error and keeps the panel open when saving fails', async () => {
    fetchMock.mockResolvedValue({ ok: false })
    component.onRedactClick({ preventDefault: vi.fn() })
    component.$input.value = 'Redacted text'

    submitForm(component.$form)
    await vi.waitFor(() => expect(component.$status.textContent).not.toBe(''))

    expect(component.$panel.hidden).toBe(false)
    expect(component.$status.textContent).toBe(
      'Error saving — please try again'
    )
    expect(component.$publishedTextValue.textContent).toBe(
      'April 2026 to September 2027'
    )
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

    resolveFetch({ ok: true })
    await vi.waitFor(() => expect(component.$status.textContent).toBe('Saved'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
