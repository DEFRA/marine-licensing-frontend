import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Other Permissions Card Component', () => {
  let $component

  const baseParams = {
    specialLegalPowers: {
      agree: 'yes',
      details: 'We have statutory powers under the Marine Act.'
    }
  }

  beforeEach(() => {
    $component = renderComponent(
      'marine-licence/other-permissions-card',
      baseParams
    )
  })

  test('Should render other permissions card component', () => {
    expect($component('#other-permissions-card')).toHaveLength(1)
  })

  test('Should display details when agree is yes', () => {
    expect($component.html()).toContain(
      'We have statutory powers under the Marine Act.'
    )
  })

  test('Should have correct card title', () => {
    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Other permissions'
    )
  })

  test('Should display "No" and not show details when agree is no', () => {
    const params = {
      specialLegalPowers: {
        agree: 'no',
        details: 'Should not be shown'
      },
      isApplicantView: true
    }
    const $comp = renderComponent(
      'marine-licence/other-permissions-card',
      params
    )
    expect($comp.html()).toContain('No')
    expect($comp.html()).not.toContain('Should not be shown')
  })

  describe('harbour authority', () => {
    test('Should display details when area is yes', () => {
      const params = {
        harbourAuthority: {
          area: 'yes',
          details: 'Portsmouth Harbour Authority'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain('Portsmouth Harbour Authority')
    })

    test('Should display correct text when area is no', () => {
      const params = {
        harbourAuthority: {
          area: 'no'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain('No')
    })

    test('Should not show row when harbourAuthority is not provided', () => {
      const params = {
        specialLegalPowers: {
          agree: 'yes',
          details: 'We have statutory powers under the Marine Act.'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).not.toContain('Located in a harbour authority area')
    })
  })

  describe('other authorities', () => {
    test('Should display details when agree is yes', () => {
      const params = {
        otherAuthorities: {
          agree: 'yes',
          details: 'Applied to harbour authority'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain('Applied to harbour authority')
    })

    test('Should display "No" and not show details when agree is no', () => {
      const params = {
        otherAuthorities: {
          agree: 'no',
          details: 'Should not be shown'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain('No')
      expect($comp.html()).not.toContain('Should not be shown')
    })

    test('Should show change link when not read only', () => {
      const params = {
        otherAuthorities: { agree: 'no' },
        isReadOnly: false
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain(
        '/marine-licence/other-authorities?from=check-your-answers'
      )
    })

    test('Should not show change link when read only', () => {
      const params = {
        otherAuthorities: { agree: 'no' },
        isReadOnly: true
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).not.toContain(
        '/marine-licence/other-authorities?from=check-your-answers'
      )
    })
  })

  describe('public consultation', () => {
    test('Should display details when consulted is yes', () => {
      const params = {
        publicConsultation: {
          consulted: 'yes',
          details: 'Spoke to local fishing association'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain('Spoke to local fishing association')
    })

    test('Should display "No" and not show details when consulted is no', () => {
      const params = {
        publicConsultation: {
          consulted: 'no',
          details: 'Should not be shown'
        }
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain('No')
      expect($comp.html()).not.toContain('Should not be shown')
    })

    test('Should show change link when not read only', () => {
      const params = {
        publicConsultation: { consulted: 'no' },
        isReadOnly: false
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).toContain(
        '/marine-licence/public-consultation?from=check-your-answers'
      )
    })

    test('Should not show change link when read only', () => {
      const params = {
        publicConsultation: { consulted: 'no' },
        isReadOnly: true
      }
      const $comp = renderComponent(
        'marine-licence/other-permissions-card',
        params
      )
      expect($comp.html()).not.toContain(
        '/marine-licence/public-consultation?from=check-your-answers'
      )
    })
  })

  describe('redaction', () => {
    const redactableParams = {
      isReadOnly: true,
      enableRedaction: true,
      specialLegalPowers: { agree: 'yes', details: 'Statutory powers detail.' },
      harbourAuthority: { area: 'no', details: 'Harbour detail.' },
      otherAuthorities: { agree: 'yes', details: 'Other authorities detail.' },
      publicConsultation: { consulted: 'no', details: 'Consultation detail.' },
      redactions: {},
      redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
      csrfToken: 'test-crumb-token'
    }

    const render = (overrides = {}) =>
      renderComponent('marine-licence/other-permissions-card', {
        ...redactableParams,
        ...overrides
      })

    test.each([
      ['specialLegalPowers', 'Statutory powers detail.'],
      ['harbourAuthority', 'No'],
      ['otherAuthorities', 'Other authorities detail.'],
      ['publicConsultation', 'No']
    ])('renders a redaction field for %s', (fieldId, text) => {
      const $component = render()

      const $field = $component(`#redaction-field-${fieldId}`)
      expect($field).toHaveLength(1)
      expect($field.find('input[name="fieldKey"]').attr('value')).toBe(fieldId)
      expect($field.find('.app-redaction-field__input').attr('value')).toBe(
        text
      )
    })

    test('renders plain text when redaction is not enabled', () => {
      const $component = render({ enableRedaction: false })

      expect($component('.app-redaction-field')).toHaveLength(0)
      expect($component.html()).toContain('Statutory powers detail.')
    })
  })
})
