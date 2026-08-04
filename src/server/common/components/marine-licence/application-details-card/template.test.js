import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Application Details Card Component', () => {
  test('Should render Application details card component', () => {
    const $componentTransferred = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag: '<a>Test</a>',
        applicationReference: 'TEST-REF',
        submittedAt: '01 01 2026',
        transferredDate: '02 01 2026',
        isTransferred: true
      }
    )
    expect($componentTransferred('#application-details-card')).toHaveLength(1)
  })

  test('Should have correct card content for transferred application', () => {
    const $componentTransferred = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag: '<a>Test</a>',
        applicationReference: 'TEST-REF',
        submittedAt: '01 01 2026',
        transferredDate: '02 01 2026',
        isTransferred: true
      }
    )
    expect(
      $componentTransferred('.govuk-summary-card__title').text().trim()
    ).toBe('Application details')

    const htmlContent = $componentTransferred.html()
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

  test('Should have correct card content for rejected application', () => {
    const $componentRejected = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag: '<a>Test</a>',
        applicationReference: 'TEST-REF',
        submittedAt: '01 01 2026',
        rejectedDate: '02 02 2026',
        isRejected: true
      }
    )
    expect($componentRejected('.govuk-summary-card__title').text().trim()).toBe(
      'Application details'
    )

    const htmlContent = $componentRejected.html()
    expect(htmlContent).toContain('Application type')
    expect(htmlContent).toContain('Marine licence application')

    expect(htmlContent).toContain('Status')
    expect(htmlContent).toContain('<a>Test</a>')

    expect(htmlContent).toContain('Reference number')
    expect(htmlContent).toContain('TEST-REF')

    expect(htmlContent).toContain('Date submitted')
    expect(htmlContent).toContain('01 01 2026')

    expect(htmlContent).toContain('Date rejected')
    expect(htmlContent).toContain('02 02 2026')
  })
})
