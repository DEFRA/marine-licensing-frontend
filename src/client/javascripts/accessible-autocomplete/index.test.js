// @vitest-environment jsdom
import { describe, expect, test, vi, beforeEach } from 'vitest'

const enhanceSelectElement = vi.fn()

vi.mock('govuk-frontend', () => ({
  Component: class {
    constructor($root) {
      this.$root = $root
    }
  }
}))

vi.mock('accessible-autocomplete', () => ({
  default: { enhanceSelectElement }
}))

const { AccessibleAutocomplete } = await import('./index.js')

describe('AccessibleAutocomplete', () => {
  beforeEach(() => {
    enhanceSelectElement.mockReset()

    document.body.innerHTML = `
      <div data-module="app-accessible-autocomplete">
        <select id="country" name="country">
          <option value="">Select a country</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="France">France</option>
        </select>
      </div>
    `
  })

  test('exposes the module name for createAll', () => {
    expect(AccessibleAutocomplete.moduleName).toBe(
      'app-accessible-autocomplete'
    )
  })

  test('enhances the select element', () => {
    const $root = document.querySelector(
      '[data-module="app-accessible-autocomplete"]'
    )

    new AccessibleAutocomplete($root) // eslint-disable-line no-new

    expect(enhanceSelectElement).toHaveBeenCalledWith(
      expect.objectContaining({
        selectElement: expect.any(HTMLSelectElement),
        defaultValue: '',
        showAllValues: true,
        confirmOnBlur: false,
        inputClasses: 'govuk-input'
      })
    )
  })

  test('removes the name from the select and creates a hidden field to submit the typed value', () => {
    const $root = document.querySelector(
      '[data-module="app-accessible-autocomplete"]'
    )
    const $select = $root.querySelector('select')
    $select.value = 'United Kingdom'

    enhanceSelectElement.mockImplementation(({ selectElement }) => {
      const $input = document.createElement('input')
      $input.id = selectElement.id
      $input.className = 'govuk-input'
      selectElement.parentNode.insertBefore($input, selectElement)
      selectElement.id = `${selectElement.id}-select`
    })

    new AccessibleAutocomplete($root) // eslint-disable-line no-new

    expect($select.getAttribute('name')).toBeNull()

    const $hiddenInput = $root.querySelector('input[type="hidden"]')
    expect($hiddenInput.name).toBe('country')
    expect($hiddenInput.value).toBe('United Kingdom')
  })

  test('mirrors whatever is typed into the hidden field as the user types', () => {
    const $root = document.querySelector(
      '[data-module="app-accessible-autocomplete"]'
    )

    enhanceSelectElement.mockImplementation(({ selectElement }) => {
      const $input = document.createElement('input')
      $input.id = selectElement.id
      $input.className = 'govuk-input'
      selectElement.parentNode.insertBefore($input, selectElement)
      selectElement.id = `${selectElement.id}-select`
    })

    new AccessibleAutocomplete($root) // eslint-disable-line no-new

    const $input = document.getElementById('country')
    $input.value = 'Not a real country'
    $input.dispatchEvent(new Event('input'))

    const $hiddenInput = $root.querySelector('input[type="hidden"]')
    expect($hiddenInput.value).toBe('Not a real country')
  })

  test('updates the hidden field via onConfirm when a suggestion is clicked or entered', () => {
    const $root = document.querySelector(
      '[data-module="app-accessible-autocomplete"]'
    )

    enhanceSelectElement.mockImplementation(({ selectElement }) => {
      const $input = document.createElement('input')
      $input.id = selectElement.id
      $input.className = 'govuk-input'
      selectElement.parentNode.insertBefore($input, selectElement)
      selectElement.id = `${selectElement.id}-select`
    })

    new AccessibleAutocomplete($root) // eslint-disable-line no-new

    const $input = document.getElementById('country')
    $input.value = 'Fra'
    $input.dispatchEvent(new Event('input'))

    const { onConfirm } = enhanceSelectElement.mock.calls[0][0]
    onConfirm('France')

    const $hiddenInput = $root.querySelector('input[type="hidden"]')
    expect($hiddenInput.value).toBe('France')
  })

  test('does nothing when there is no select', () => {
    document.body.innerHTML =
      '<div data-module="app-accessible-autocomplete"></div>'
    const $root = document.querySelector(
      '[data-module="app-accessible-autocomplete"]'
    )

    new AccessibleAutocomplete($root) // eslint-disable-line no-new

    expect(enhanceSelectElement).not.toHaveBeenCalled()
  })
})
