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
    enhanceSelectElement.mockClear()

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
