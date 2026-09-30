import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

const policies = [
  {
    policyCode: 'S-CC-1',
    title: 'South Climate change 1',
    wording: 'First policy wording.',
    response: 'My first consideration.',
    changeHref: '/marine-licence/marine-plan-policy/S-CC-1'
  },
  {
    policyCode: 'S-CC-2',
    title: 'South Climate change 2',
    wording: 'Second policy wording.',
    response: 'My second consideration.',
    changeHref: '/marine-licence/marine-plan-policy/S-CC-2'
  }
]

const crossCutting = (sectionPolicies = policies) => [
  { section: 'Cross-cutting', slug: 'cross-cutting', policies: sectionPolicies }
]

const sections = crossCutting()

describe('Marine Licence Marine Plan Policies Component', () => {
  test('renders one card per section headed with the section name', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections: [
        ...sections,
        {
          section: 'Economic',
          slug: 'economic',
          policies: [{ ...policies[0], policyCode: 'S-CAB-1' }]
        }
      ]
    })

    expect($('.govuk-summary-card')).toHaveLength(2)
    expect($('#marine-plan-policies-card-cross-cutting')).toHaveLength(1)
    expect($('#marine-plan-policies-card-economic')).toHaveLength(1)
    expect(
      $('.govuk-summary-card__title')
        .map((_, el) => $(el).text().trim())
        .get()
    ).toEqual([
      'Marine plan policies – Cross-cutting',
      'Marine plan policies – Economic'
    ])
  })

  test('shows the plain-English title with the code on a new line', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections
    })

    const $key = $('.govuk-summary-list__key').first()
    expect($key.find('br')).toHaveLength(1)
    expect($key.text().trim()).toBe('South Climate change 1(S-CC-1)')
  })

  test('shows only the code when a policy has no title', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections: crossCutting([{ ...policies[0], title: null }])
    })

    const $key = $('.govuk-summary-list__key').first()
    expect($key.find('br')).toHaveLength(0)
    expect($key.text().trim()).toBe('S-CC-1')
  })

  test('escapes the policy title', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections: crossCutting([
        { ...policies[0], title: '<script>alert(1)</script>' }
      ])
    })

    expect($('.govuk-summary-list__key script')).toHaveLength(0)
    expect($('.govuk-summary-list__key').text()).toContain(
      '<script>alert(1)</script>'
    )
  })

  test('renders one row per policy with code, wording and consideration for applicant', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections,
      isApplicant: true
    })

    expect($('.govuk-summary-list__row')).toHaveLength(2)
    const html = $.html()
    expect(html).toContain('S-CC-1')
    expect(html).toContain('First policy wording.')
    expect(html).toContain('My first consideration.')
    expect(html).toContain('Policy information')
    expect(html).toContain('Your consideration')
  })

  test('renders one row per policy with code, wording and consideration for public view', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections
    })

    expect($('.govuk-summary-list__row')).toHaveLength(2)
    const html = $.html()
    expect(html).toContain('S-CC-1')
    expect(html).toContain('First policy wording.')
    expect(html).toContain('My first consideration.')
    expect(html).toContain('Policy information')
    expect(html).toContain(`Applicant's consideration`)
  })

  test('shows a Change link per policy when not read only', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections
    })

    expect($('.govuk-summary-list__actions a')).toHaveLength(2)
    expect($.html()).toContain('/marine-licence/marine-plan-policy/S-CC-1')
    expect($('.govuk-summary-list__actions a').first().text()).toContain(
      'marine plan policy S-CC-1'
    )
  })

  test('hides Change links when read only', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections,
      isReadOnly: true
    })

    expect($('.govuk-summary-list__actions a')).toHaveLength(0)
  })

  test('escapes user-provided consideration text', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections: crossCutting([
        {
          policyCode: 'S-CC-1',
          wording: 'w',
          response: '<script>alert(1)</script>',
          changeHref: '/x'
        }
      ])
    })

    expect($.html()).not.toContain('<script>alert(1)</script>')
    expect($.html()).toContain('&lt;script&gt;')
  })

  test('renders policy wording HTML as formatted markup', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections: crossCutting([
        {
          policyCode: 'S-CC-1',
          wording: '<p>Intro</p><ul><li>item one</li><li>item two</li></ul>',
          response: 'My consideration',
          changeHref: '/marine-licence/marine-plan-policy/S-CC-1'
        }
      ])
    })

    expect($('.app-policy-wording p').first().text()).toBe('Intro')
    expect($('.app-policy-wording ul li')).toHaveLength(2)
    expect($.html()).not.toContain('&lt;p&gt;')
  })

  test('renders no cards when there are no sections', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      sections: []
    })

    expect($('.govuk-summary-card')).toHaveLength(0)
  })

  describe('redaction', () => {
    const redactableParams = {
      isReadOnly: true,
      enableRedaction: true,
      sections: crossCutting([
        {
          policyCode: 'E-AGG-3',
          wording: '<p>Wording</p>',
          response: 'My consideration'
        }
      ]),
      redactions: {},
      redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
      csrfToken: 'test-crumb-token'
    }

    test('renders a redaction field for the policy response', () => {
      const $ = renderComponent(
        'marine-licence/marine-plan-policies-card',
        redactableParams
      )

      const $field = $('#redaction-field-marinePlanPolicyResponse-E-AGG-3')
      expect($field).toHaveLength(1)
      expect($field.find('input[name="fieldKey"]').attr('value')).toBe(
        'marinePlanPolicyResponses'
      )
      expect($field.find('input[name="policyCode"]').attr('value')).toBe(
        'E-AGG-3'
      )
      expect($field.find('.app-redaction-field__input').attr('value')).toBe(
        'My consideration'
      )
    })

    test('shows the redacted state for an already redacted response', () => {
      const $ = renderComponent('marine-licence/marine-plan-policies-card', {
        ...redactableParams,
        redactions: {
          marinePlanPolicyResponses: {
            'E-AGG-3': {
              redactedText: 'Redacted by MMO',
              redactedTextValue: 'Redacted by MMO'
            }
          }
        }
      })

      expect($('.app-redaction-field__trigger').text()).toContain(
        'Change redaction'
      )
      expect($('.app-redaction-field__input').attr('value')).toBe(
        'Redacted by MMO'
      )
    })

    test('renders plain text when redaction is not enabled', () => {
      const $ = renderComponent('marine-licence/marine-plan-policies-card', {
        ...redactableParams,
        enableRedaction: false
      })

      expect($('.app-redaction-field')).toHaveLength(0)
      expect($.html()).toContain('My consideration')
    })
  })
})
