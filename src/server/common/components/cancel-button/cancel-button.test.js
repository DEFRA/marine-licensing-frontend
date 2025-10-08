import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('cancelButton Component', () => {
  let $cancelButton

  test('Should render cancel button correctly with default text', () => {
    $cancelButton = renderComponent('cancel-button', {
      cancelLink: '/test-link'
    })

    expect($cancelButton('a')).toHaveLength(1)
    expect($cancelButton('a').text().trim()).toBe('Cancel')
    expect($cancelButton('a').attr('href')).toBe('/test-link')
    expect($cancelButton('a').hasClass('govuk-link')).toBe(true)
    expect($cancelButton('a').hasClass('govuk-link--no-visited-state')).toBe(
      true
    )
  })
})
