import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('AccessibleAutocomplete component', () => {
  test('Should render select inside data-module wrapper', () => {
    const $component = renderComponent('accessible-autocomplete', {
      id: 'country',
      name: 'country',
      label: {
        text: 'Country'
      },
      items: [
        { value: 'United Kingdom', text: 'United Kingdom' },
        { value: 'France', text: 'France' }
      ]
    })

    const $wrapper = $component('[data-module="app-accessible-autocomplete"]')
    expect($wrapper).toHaveLength(1)
    expect($wrapper.find('select#country')).toHaveLength(1)
    expect($wrapper.find('select#country').attr('name')).toBe('country')
    expect($wrapper.find('option')).toHaveLength(3)
    expect(
      $component(
        'script[src="/public/javascripts/accessible-autocomplete.min.js"]'
      )
    ).toHaveLength(1)
  })
})
