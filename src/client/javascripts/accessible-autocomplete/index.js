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

    this.$arrow = this.$root.querySelector('.autocomplete__dropdown-arrow-down')

    if (
      this.$arrow instanceof SVGSVGElement &&
      !this.$arrow.getAttribute('viewBox')
    ) {
      this.$arrow.setAttribute('viewBox', '0 0 22 17')
      this.$arrow.setAttribute('preserveAspectRatio', 'none')
    }
  }

  static moduleName = 'app-accessible-autocomplete'
}
