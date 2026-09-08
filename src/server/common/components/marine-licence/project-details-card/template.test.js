import { renderComponent } from '#src/server/test-helpers/component-helpers.js'
import { mockRedactions } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Marine Licence Project Details Card Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('marine-licence/project-details-card', {
      projectName: 'Test Marine Project'
    })
  })

  test('Should render project details card component', () => {
    expect($component('#project-details-card')).toHaveLength(1)
  })

  test('Should display project name', () => {
    const htmlContent = $component.html()
    expect(htmlContent).toContain('Test Marine Project')
  })

  test('Should not display project name row when not present', () => {
    const $componentNoProjectName = renderComponent(
      'marine-licence/project-details-card'
    )
    const htmlContent = $componentNoProjectName.html()

    expect(htmlContent).not.toContain('Project name')
    expect(htmlContent).not.toContain('Test Marine Project')
  })

  test('Should have correct card title', () => {
    const $componentWithoutProjectName = renderComponent(
      'marine-licence/project-details-card'
    )
    const htmlContent = $componentWithoutProjectName.html()

    expect(htmlContent).not.toContain('Project name')
  })

  describe('change links', () => {
    test('Should show change links when not read only', () => {
      const $comp = renderComponent('marine-licence/project-details-card', {
        projectName: 'Test Marine Project',
        isReadOnly: false
      })
      expect($comp.html()).toContain(
        '/marine-licence/project-name?from=check-your-answers'
      )
      expect($comp.html()).toContain(
        '/marine-licence/project-background?from=check-your-answers'
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
        '/marine-licence/project-name?from=check-your-answers'
      )
      expect($comp.html()).not.toContain(
        '/marine-licence/project-background?from=check-your-answers'
      )
    })
  })

  describe('redaction available', () => {
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
