import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

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

  test('Should have correct card title', () => {
    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Project details'
    )
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
})
