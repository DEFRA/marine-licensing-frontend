import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Policy Wording Component', () => {
  test('renders policy wording HTML as markup inside the wrapper', () => {
    const $ = renderComponent('marine-licence/policy-wording', {
      html: '<p>Intro text</p><ol><li>first item</li><li>second item</li></ol>'
    })

    const wrapper = $('.app-policy-wording')
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('govuk-body')).toBe(true)
    expect(wrapper.find('p').first().text()).toBe('Intro text')
    expect(wrapper.find('ol li')).toHaveLength(2)
    expect($.html()).not.toContain('&lt;p&gt;')
  })

  test('renders links with their attributes intact', () => {
    const $ = renderComponent('marine-licence/policy-wording', {
      html: '<p><a href="https://www.gov.uk/x" target="_blank" rel="noopener noreferrer">GOV.UK</a></p>'
    })

    const link = $('.app-policy-wording a')
    expect(link.attr('href')).toBe('https://www.gov.uk/x')
    expect(link.attr('rel')).toBe('noopener noreferrer')
  })

  test('renders nothing when html is empty or missing', () => {
    expect(
      renderComponent('marine-licence/policy-wording', { html: '' })(
        '.app-policy-wording'
      )
    ).toHaveLength(0)
    expect(
      renderComponent(
        'marine-licence/policy-wording',
        {}
      )('.app-policy-wording')
    ).toHaveLength(0)
  })
})
