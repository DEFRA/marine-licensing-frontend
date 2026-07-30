import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Application Details Card Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('marine-licence/application-details-card', {
      statusTag: '<a>Test</a>',
      applicationReference: 'TEST-REF',
      submittedAt: '01 01 2026',
      transferredDate: '02 01 2026'
    })
  })

  test('Should render Application Details card component', () => {
    expect($component('#application-details-card')).toHaveLength(1)
  })

  test('Should have correct card title', () => {
    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Application Details'
    )

    const htmlContent = $component.html()
    expect(htmlContent).toContain('Application type')
    expect(htmlContent).toContain('Marine licence application')

    expect(htmlContent).toContain('Status')
    expect(htmlContent).toContain('<a>Test</a>')

    expect(htmlContent).toContain('Reference number')
    expect(htmlContent).toContain('TEST-REF')

    expect(htmlContent).toContain('Date submitted')
    expect(htmlContent).toContain('01 01 2026')

    expect(htmlContent).toContain('Date of transfer')
    expect(htmlContent).toContain('02 01 2026')
  })
})
