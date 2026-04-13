import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('backLinkHistory Component', () => {
  let $backLink

  test('Should render back link correctly with default text', () => {
    $backLink = renderComponent('back-link-history')

    expect($backLink('nav').hasClass('hide-if-no-js')).toBe(true)
    expect($backLink('a')).toHaveLength(1)
    expect($backLink('a').text().trim()).toBe('Back')
    expect($backLink('a').attr('href')).toBe('#')
    expect($backLink('a').attr('data-module')).toBe('app-back-link-history')
    expect($backLink('a').hasClass('govuk-back-link')).toBe(true)
    expect($backLink('a').hasClass('govuk-!-margin-bottom-0')).toBe(true)
    expect($backLink('a').attr('style')).toBeUndefined()
  })
})
