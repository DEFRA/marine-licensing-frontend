import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Incomplete Field Component', () => {
  test('Should render text provided when set', () => {
    const $incompleteField = renderComponent('incomplete-field', 'test')
    expect($incompleteField.text()).toBe('test')
    expect($incompleteField('strong').hasClass('govuk-tag')).toBe(false)
  })

  test('Should render incomplete tag provided when not set', () => {
    const $incompleteField = renderComponent('incomplete-field')
    expect($incompleteField('strong').hasClass('govuk-tag')).toBe(true)
  })

  test('Should render incomplete tag provided when empty string', () => {
    const $incompleteField = renderComponent('incomplete-field', '')
    expect($incompleteField('strong').hasClass('govuk-tag')).toBe(true)
  })
})

/**
 * @import { CheerioAPI } from 'cheerio'
 */
