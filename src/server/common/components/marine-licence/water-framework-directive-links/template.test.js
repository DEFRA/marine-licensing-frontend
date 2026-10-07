import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Water Framework Directive Links Component', () => {
  test('renders the scoping document introduction', () => {
    const $ = renderComponent('marine-licence/water-framework-directive-links', {})

    expect($('p').first().text()).toBe(
      "If you need to provide a WFD assessment, you can use the following template. It's called a scoping document."
    )
  })

  test('renders the scoping document download link', () => {
    const $ = renderComponent('marine-licence/water-framework-directive-links', {})

    const link = $('a').eq(0)
    expect(link.text()).toBe(
      'Download the WFD assessment scoping document (ODT, 24KB)'
    )
    expect(link.attr('href')).toBe(
      'https://assets.publishing.service.gov.uk/media/6ab4e3b9fceb6fb3a650110e/wfd_scoping_template__1_.odt'
    )
  })

  test('renders the guidance link opening in a new tab', () => {
    const $ = renderComponent('marine-licence/water-framework-directive-links', {})

    const link = $('a').eq(1)
    expect(link.text()).toBe(
      "Read the Environment Agency's guidance on the Water Framework Directive assessments for more information (opens in new tab)"
    )
    expect(link.attr('href')).toBe(
      'https://www.gov.uk/guidance/water-framework-directive-assessment-estuarine-and-coastal-waters'
    )
    expect(link.attr('target')).toBe('_blank')
    expect(link.attr('rel')).toBe('noreferrer noopener')
  })
})
