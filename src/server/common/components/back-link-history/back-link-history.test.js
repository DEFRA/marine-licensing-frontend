import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('backLinkHistory Component', () => {
  /** @type {CheerioAPI} */
  let $backLink

  test('Should render back link correctly with default text', () => {
    $backLink = renderComponent('back-link-history')

    expect($backLink('nav').hasClass('hide-if-no-js')).toBe(true)
    expect($backLink('a')).toHaveLength(1)
    expect($backLink('a').text().trim()).toBe('Back')
    expect($backLink('a').attr('href')).toBe('javascript:window.history.back()')
    expect($backLink('a').hasClass('govuk-back-link')).toBe(true)
  })
})

/**
 * @import { CheerioAPI } from 'cheerio'
 */
