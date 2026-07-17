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

    // enhanceSelectElement gives the visible input an empty name, so it's
    // never submitted, and the hidden select can only ever hold one of its
    // own predefined option values — there's no way to make a typed value
    // "the submitted value" through either of those elements. Submit the
    // typed text itself instead: take the select out of the form and mirror
    // the input's value into our own hidden field, both live as the user
    // types and via onConfirm when a suggestion is clicked or entered
    // (which sets the input's value without firing a native `input` event).
    // Server-side validation (against the same option list) is what rejects
    // values that don't match a real option.
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
