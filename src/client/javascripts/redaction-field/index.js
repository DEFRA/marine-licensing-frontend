import { Component } from 'govuk-frontend'

const FETCH_TIMEOUT_MS = 8000
const REDACTION_PLACEHOLDER = '***REDACTED***'

export class RedactionField extends Component {
  static moduleName = 'redaction-field'

  constructor($root) {
    super($root)

    this.$trigger = this.$root.querySelector('.app-redaction-field__trigger')
    this.$panel = this.$root.querySelector('.app-redaction-field__panel')
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

    this.$publishedTextContainer = this.$root.querySelector(
      '.app-redaction-field__published-text'
    )
    this.$publishedTextValue = this.$root.querySelector(
      '.app-redaction-field__published-text-value'
    )

    this.lastSavedValue = this.$input.value

    this.$copyButton.hidden = false
    this.$cancelButton.hidden = false
    this.closePanel({ focusTrigger: false })

    this.$trigger.addEventListener('click', (event) =>
      this.onRedactClick(event)
    )
    this.$cancelButton.addEventListener('click', () => this.onCancelClick())
    this.$copyButton.addEventListener('click', () => this.onCopyClick())
    this.$form.addEventListener('submit', (event) => this.onSaveSubmit(event))
  }

  onRedactClick(event) {
    event.preventDefault()
    this.$panel.hidden = false
    this.$trigger.setAttribute('aria-expanded', 'true')
    this.$trigger.hidden = true
    this.$publishedTextContainer.hidden = true
    this.$input.focus()
  }

  onCancelClick() {
    this.$input.value = this.lastSavedValue
    this.closePanel()
  }

  closePanel({ focusTrigger = true } = {}) {
    this.$panel.hidden = true
    this.$trigger.setAttribute('aria-expanded', 'false')
    this.$trigger.hidden = false
    this.$publishedTextContainer.hidden = false

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

    this.setControlsDisabled(true)
    this.announce('')

    try {
      const response = await fetch(this.$form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(new FormData(this.$form))),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      })

      if (!response.ok) {
        throw new Error('Unexpected response saving redaction')
      }

      this.onSaveSuccess()
    } catch {
      this.announce('Error saving — please try again')
    } finally {
      this.setControlsDisabled(false)
    }
  }

  onSaveSuccess() {
    this.lastSavedValue = this.$input.value
    this.$publishedTextValue.textContent = this.$input.value
    this.closePanel()
    this.announce('Saved')
  }

  setControlsDisabled(isDisabled) {
    this.$saveButton.disabled = isDisabled
    this.$cancelButton.disabled = isDisabled
  }
}
