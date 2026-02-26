import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine License Project Details Card Component', () => {
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
      'Project summary'
    )
  })
})
