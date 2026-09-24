import { Component } from 'govuk-frontend'
import { RedactionField } from '../redaction-field/index.js'
import { SiteDetailsMap } from '../site-details-map/index.js'

const FETCH_TIMEOUT_MS = 8000

const initCardComponents = ($card) => {
  for (const $field of $card.querySelectorAll(
    '[data-module="redaction-field"]'
  )) {
    new RedactionField($field) // eslint-disable-line no-new
  }

  for (const $map of $card.querySelectorAll(
    '[data-module="site-details-map"]'
  )) {
    new SiteDetailsMap($map) // eslint-disable-line no-new
  }
}

export class WithholdLocation extends Component {
  static moduleName = 'withhold-location'

  constructor($root) {
    super($root)

    this.$form = this.$root.querySelector('.app-withhold-location__form')
    this.$button = this.$root.querySelector('.app-withhold__button')

    this.$form.addEventListener('submit', (event) => this.onSubmit(event))
  }

  async onSubmit(event) {
    event.preventDefault()

    if (this.$button.disabled) {
      return
    }

    this.$button.disabled = true

    try {
      const response = await fetch(this.$form.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: new URLSearchParams(new FormData(this.$form)),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      })

      if (!response.ok) {
        throw new Error('Unexpected response saving withhold location')
      }

      this.replaceCard(await response.text())
    } catch {
      this.$button.disabled = false
    }
  }

  replaceCard(html) {
    const template = document.createElement('template')
    template.innerHTML = html

    const $new = template.content.getElementById(this.$root.id)

    this.$root.replaceWith($new)
    initCardComponents($new)

    new WithholdLocation($new).$button.focus()
  }
}
