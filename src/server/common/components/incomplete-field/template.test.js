import { renderComponentJSDOM } from '~/src/server/test-helpers/component-helpers.js'

describe('Incomplete Field Component', () => {
  test('Should render text provided when set', () => {
    const incompleteField = renderComponentJSDOM('incomplete-field', {
      text: 'test'
    })
    expect(incompleteField.body.textContent).toBe('test')
    expect(incompleteField.querySelectorAll('strong').length).toBeFalsy()
  })

  test('Should render incomplete tag provided when not set', () => {
    const incompleteField = renderComponentJSDOM('incomplete-field', {
      text: ''
    })
    expect(
      incompleteField.querySelector('strong').classList.contains('govuk-tag')
    ).toBe(true)
  })

  test('Should render incomplete tag provided when empty string', () => {
    const incompleteField = renderComponentJSDOM('incomplete-field', {})
    expect(
      incompleteField.querySelector('strong').classList.contains('govuk-tag')
    ).toBe(true)
  })
})
