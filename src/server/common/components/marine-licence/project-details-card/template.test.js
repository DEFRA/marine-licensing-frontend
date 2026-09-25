import { renderComponent } from '#src/server/test-helpers/component-helpers.js'
import { mockRedactions } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Marine Licence Application Details Card Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('marine-licence/project-details-card', {
      projectName: 'Test Marine Project'
    })
  })

  test('Should render application details card component', () => {
    expect($component('#project-details-card')).toHaveLength(1)
  })

  test('Should display application name', () => {
    const htmlContent = $component.html()
    expect(htmlContent).toContain('Test Marine Project')
  })

  test('Should not display application name row when not present', () => {
    const $componentNoProjectName = renderComponent(
      'marine-licence/project-details-card'
    )
    const htmlContent = $componentNoProjectName.html()

    expect(htmlContent).not.toContain('Application name')
    expect(htmlContent).not.toContain('Test Marine Project')
  })

  test('Should have correct card title', () => {
    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Application details'
    )
  })

  describe('change links', () => {
    test('Should show change links when not read only', () => {
      const $comp = renderComponent('marine-licence/project-details-card', {
        projectName: 'Test Marine Project',
        isReadOnly: false
      })
      expect($comp.html()).toContain(
        '/marine-licence/application-name?from=check-your-answers'
      )
      expect($comp.html()).toContain(
        '/marine-licence/proposed-works-summary?from=check-your-answers'
      )
      expect($comp.html()).toContain(
        '/marine-licence/start-and-end-dates?from=check-your-answers'
      )
    })

    test('Should not show change links when read only', () => {
      const $comp = renderComponent('marine-licence/project-details-card', {
        projectName: 'Test Marine Project',
        isReadOnly: true
      })
      expect($comp.html()).not.toContain(
        '/marine-licence/application-name?from=check-your-answers'
      )
      expect($comp.html()).not.toContain(
        '/marine-licence/proposed-works-summary?from=check-your-answers'
      )
    })
  })

  describe('redaction available', () => {
    const redactableParams = {
      isReadOnly: true,
      enableRedaction: true,
      projectName: 'Test Marine Project',
      projectBackground: 'Some project background',
      preferredDates: 'April 2026 to September 2027',
      redactions: {},
      redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
      csrfToken: 'test-crumb-token'
    }

    test.each([
      ['projectName', 'Test Marine Project'],
      ['projectBackground', 'Some project background'],
      ['preferredDates', 'April 2026 to September 2027']
    ])('renders a redaction field for %s', (fieldId, text) => {
      const $comp = renderComponent(
        'marine-licence/project-details-card',
        redactableParams
      )

      const $field = $comp(`#redaction-field-${fieldId}`)
      expect($field).toHaveLength(1)
      expect($field.find('input[name="fieldKey"]').attr('value')).toBe(fieldId)
      expect($field.find('.app-redaction-field__input').attr('value')).toBe(
        text
      )
    })

    test('renders a field correctly when redaction is enabled', () => {
      const $comp = renderComponent('marine-licence/project-details-card', {
        isReadOnly: true,
        enableRedaction: true,
        preferredDates: 'April 2026 to September 2027',
        redactions: {},
        redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
        csrfToken: 'test-crumb-token'
      })

      expect($comp.html()).toContain('data-module="redaction-field"')
      expect($comp.html()).toContain(
        'action="/view-marine-licence-details/test-id/redact"'
      )
      expect($comp.html()).toContain('April 2026 to September 2027')
    })

    test('renders the redacted text when the field has been redacted', () => {
      const $comp = renderComponent('marine-licence/project-details-card', {
        isReadOnly: true,
        enableRedaction: true,
        preferredDates: 'April 2026 to September 2027',
        redactions: mockRedactions,
        redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
        csrfToken: 'test-crumb-token'
      })

      expect($comp.html()).toContain(mockRedactions.preferredDates.redactedText)
    })
  })
})
