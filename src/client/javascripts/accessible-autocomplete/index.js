import { Component } from 'govuk-frontend'

export class AccessibleAutocomplete extends Component {
  /**
   * @param {Element} $root - Element with data-module="app-accessible-autocomplete"
   */
  constructor($root) {
    super($root)

    this.$select = this.$root.querySelector('select')

    if (!(this.$select instanceof HTMLSelectElement)) {
      return
    }

    const accessibleAutocomplete = globalThis.accessibleAutocomplete

    if (typeof accessibleAutocomplete?.enhanceSelectElement !== 'function') {
      return
    }

    accessibleAutocomplete.enhanceSelectElement({
      selectElement: this.$select,
      defaultValue: '',
      showAllValues: true,
      confirmOnBlur: false,
      inputClasses: 'govuk-input'
    })

    this.$input = document.getElementById(
      this.$select.id.replace(/-select$/, '')
    )
  }

  static moduleName = 'app-accessible-autocomplete'
}
