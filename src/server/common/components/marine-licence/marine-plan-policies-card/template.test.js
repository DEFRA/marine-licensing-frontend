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

  test('renders one row per policy with code, wording and consideration for applicant', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies,
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
      policies
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

  test('renders policy wording HTML as formatted markup', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies: [
        {
          policyCode: 'S-CC-1',
          wording: '<p>Intro</p><ul><li>item one</li><li>item two</li></ul>',
          response: 'My consideration',
          changeHref: '/marine-licence/marine-plan-policy/S-CC-1'
        }
      ]
    })

    expect($('.app-policy-wording p').first().text()).toBe('Intro')
    expect($('.app-policy-wording ul li')).toHaveLength(2)
    expect($.html()).not.toContain('&lt;p&gt;')
  })

  test('does not render the card when there are no policies', () => {
    const $ = renderComponent('marine-licence/marine-plan-policies-card', {
      policies: []
    })

    expect($('#marine-plan-policies-card')).toHaveLength(0)
  })

  describe('redaction', () => {
    const redactableParams = {
      isReadOnly: true,
      enableRedaction: true,
      policies: [
        {
          policyCode: 'E-AGG-3',
          wording: '<p>Wording</p>',
          response: 'My consideration'
        }
      ],
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
