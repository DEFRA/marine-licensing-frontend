import { Component } from 'govuk-frontend'
import accessibleAutocomplete from 'accessible-autocomplete'

import { dropdownArrowDown } from './dropdown-arrow-down.js'

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

    const inputId = this.$select.id
    const fieldName = this.$select.name

    this.$select.removeAttribute('name')

    this.$hiddenInput = document.createElement('input')
    this.$hiddenInput.type = 'hidden'
    this.$hiddenInput.name = fieldName
    this.$hiddenInput.value = this.$select.value
    this.$root.appendChild(this.$hiddenInput)

    accessibleAutocomplete.enhanceSelectElement({
      selectElement: this.$select,
      defaultValue: '',
      showAllValues: true,
      confirmOnBlur: false,
      inputClasses: 'govuk-input',
      dropdownArrow: dropdownArrowDown,
      onConfirm: (value) => {
        this.$hiddenInput.value = value ?? ''
      }
    })

    this.$input = document.getElementById(inputId)
    this.$input?.addEventListener('input', () => {
      this.$hiddenInput.value = this.$input.value
    })
  }

  static moduleName = 'app-accessible-autocomplete'
}
