import { Component } from 'govuk-frontend'

const FETCH_TIMEOUT_MS = 8000
const REDACTION_PLACEHOLDER = '***REDACTED***'

export class RedactionField extends Component {
  static moduleName = 'redaction-field'

  constructor($root) {
    super($root)

    this.$trigger = this.$root.querySelector('.app-redaction-field__trigger')
    this.$redactPanel = this.$root.querySelector('.app-redaction-field__panel')
    this.$form = this.$root.querySelector('.app-redaction-field__form')
    this.$input = this.$root.querySelector('.app-redaction-field__input')
    this.$copyButton = this.$root.querySelector(
      '.app-redaction-field__copy-button'
    )
    this.$saveButton = this.$root.querySelector(
      '.app-redaction-field__save-button'
    )
    this.$cancelButton = this.$root.querySelector(
      '.app-redaction-field__cancel-button'
    )
    this.$status = this.$root.querySelector('.app-redaction-field__status')

    this.$redactedTextContainer = this.$root.querySelector(
      '.app-redaction-field__published-text'
    )
    this.$copyButton.hidden = false
    this.$cancelButton.hidden = false
    this.closePanel({ focusTrigger: false })

    this.$trigger.addEventListener('click', (event) =>
      this.onRedactClick(event)
    )
    this.$cancelButton.addEventListener('click', (event) =>
      this.onCancelClick(event)
    )
    this.$copyButton.addEventListener('click', () => this.onCopyClick())
    this.$form.addEventListener('submit', (event) => this.onSaveSubmit(event))
  }

  onRedactClick(event) {
    event.preventDefault()
    this.$redactPanel.hidden = false
    this.$trigger.setAttribute('aria-expanded', 'true')
    this.$trigger.hidden = true
    this.$redactedTextContainer.hidden = true
    this.$input.focus()
  }

  onCancelClick(event) {
    event.preventDefault()

    if (this.$saveButton.disabled) {
      return
    }

    this.$form.reset()
    this.closePanel()
  }

  closePanel({ focusTrigger = true } = {}) {
    this.$redactPanel.hidden = true

    this.$trigger.setAttribute('aria-expanded', 'false')
    this.$trigger.hidden = false
    this.$redactedTextContainer.hidden = false

    if (focusTrigger) {
      this.$trigger.focus()
    }
  }

  async onCopyClick() {
    try {
      await navigator.clipboard.writeText(REDACTION_PLACEHOLDER)
      this.announce('Copied')
    } catch {}
  }

  announce(message) {
    this.$status.textContent = message
  }

  async onSaveSubmit(event) {
    event.preventDefault()

    if (this.$saveButton.disabled) {
      return
    }

    this.setSaving(true)
    this.announce('')

    try {
      const response = await fetch(this.$form.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: new URLSearchParams(new FormData(this.$form)),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      })

      if (!response.ok) {
        throw new Error('Unexpected response saving redaction')
      }

      const responseText = await response.text()
      this.onSaveSuccess(responseText)
    } catch {
      this.announce('Error saving — please try again')
    } finally {
      this.setSaving(false)
    }
  }

  onSaveSuccess(html) {
    const template = document.createElement('template')
    template.innerHTML = html

    const $new = template.content.getElementById(this.$root.id)

    this.$root.replaceWith($new)

    const component = new RedactionField($new)
    component.$trigger.focus()
    component.announce('Saved')
  }

  setSaving(isSaving) {
    this.$saveButton.disabled = isSaving
    this.$cancelButton.setAttribute('aria-disabled', String(isSaving))
  }
}
