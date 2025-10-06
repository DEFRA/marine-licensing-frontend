import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Application Details Card Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z',
      isReadOnly: true
    })
  })

  test('Should render project details card component', () => {
    expect($component('#application-details-card')).toHaveLength(1)
  })

  test('Should display application type', () => {
    const htmlContent = $component.html()
    expect(htmlContent).toContain('Exempt activity notification')
  })

  test('Should display application reference', () => {
    const htmlContent = $component.html()
    expect(htmlContent).toContain('EXE/2025/10121')
  })

  test('Should display submitted date', () => {
    const htmlContent = $component.html()
    expect(htmlContent).toContain('18 September 2025')
  })

  test('Should have correct card title', () => {
    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Application details'
    )
  })
})
