import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('backLink Component', () => {
  let $backLink

  test('Should render back link correctly with default text', () => {
    $backLink = renderComponent('back-link', {
      backLink: '/test-link'
    })

    expect($backLink('a').text().trim()).toBe('Back')
    expect($backLink('a').attr('href')).toBe('/test-link')
    expect($backLink('a').hasClass('govuk-back-link')).toBe(true)
  })
})
