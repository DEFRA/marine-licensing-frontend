import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

const policies = [
  {
    policyCode: 'S-CC-1',
    wording: 'First policy wording.',
    response: 'My first consideration.',
    changeHref: '/marine-licence/marine-plan-policy/S-CC-1'
  },
  {
    policyCode: 'S-CC-2',
    wording: 'Second policy wording.',
    response: 'My second consideration.',
    changeHref: '/marine-licence/marine-plan-policy/S-CC-2'
  }
]

describe('Marine Licence Marine Plan Policies Component', () => {
  test('renders a card headed "Marine plan policies"', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies
    })

    expect($('#marine-plan-policies-card')).toHaveLength(1)
    expect($('.govuk-summary-card__title').text().trim()).toBe(
      'Marine plan policies'
    )
  })

  test('renders one row per policy with code, wording and consideration', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies
    })

    expect($('.govuk-summary-list__row')).toHaveLength(2)
    const html = $.html()
    expect(html).toContain('S-CC-1')
    expect(html).toContain('First policy wording.')
    expect(html).toContain('My first consideration.')
    expect(html).toContain('Policy information')
    expect(html).toContain('Your consideration')
  })

  test('shows a Change link per policy when not read only', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies
    })

    expect($('.govuk-summary-list__actions a')).toHaveLength(2)
    expect($.html()).toContain('/marine-licence/marine-plan-policy/S-CC-1')
    expect($('.govuk-summary-list__actions a').first().text()).toContain(
      'marine plan policy S-CC-1'
    )
  })

  test('hides Change links when read only', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies,
      isReadOnly: true
    })

    expect($('.govuk-summary-list__actions a')).toHaveLength(0)
  })

  test('escapes user-provided consideration text', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies: [
        {
          policyCode: 'S-CC-1',
          wording: 'w',
          response: '<script>alert(1)</script>',
          changeHref: '/x'
        }
      ]
    })

    expect($.html()).not.toContain('<script>alert(1)</script>')
    expect($.html()).toContain('&lt;script&gt;')
  })

  test('does not render the card when there are no policies', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies: []
    })

    expect($('#marine-plan-policies-card')).toHaveLength(0)
  })
})
