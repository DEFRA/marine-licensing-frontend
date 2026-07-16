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

    accessibleAutocomplete.enhanceSelectElement({
      selectElement: this.$select,
      defaultValue: '',
      showAllValues: true,
      confirmOnBlur: false,
      inputClasses: 'govuk-input',
      dropdownArrow: dropdownArrowDown
    })
  }

  static moduleName = 'app-accessible-autocomplete'
}
