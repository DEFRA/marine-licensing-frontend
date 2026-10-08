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
    expect($componentTransferred('#application-overview-card')).toHaveLength(1)
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
    ).toBe('Application overview')

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

    expect(htmlContent).not.toContain('Date withdrawn')
  })

  test('Should render the date withdrawn row and omit the transfer row for a withdrawn application', () => {
    const $withdrawn = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag:
          '<strong class="govuk-tag govuk-tag--grey">Withdrawn</strong>',
        applicationReference: 'MLA/2025/10018',
        submittedAt: '15 December 2025',
        withdrawnAt: '19 January 2026'
      }
    )

    const htmlContent = $withdrawn.html()

    expect(htmlContent).toContain('Date withdrawn')
    expect(htmlContent).toContain('19 January 2026')
    expect(htmlContent).toContain('Withdrawn')

    expect(htmlContent).not.toContain('Date of transfer')
  })

  test('Should have correct card content for rejected application', () => {
    const $componentRejected = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag: '<a>Test</a>',
        applicationReference: 'TEST-REF',
        submittedAt: '01 01 2026',
        rejectedDate: '02 02 2026',
        rejectedReasons: '<p>Test reason</p>',
        isRejected: true
      }
    )
    expect($componentRejected('.govuk-summary-card__title').text().trim()).toBe(
      'Application overview'
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

    expect(htmlContent).toContain('Date marked as unable to progress')
    expect(htmlContent).toContain('02 02 2026')

    expect(htmlContent).toContain('Reasons marked as unable to progress')
    expect(htmlContent).toContain('<p>Test reason</p>')
  })

  test('Should render who the marine licence is for after the reference number', () => {
    const $component = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag: '<a>Test</a>',
        applicationReference: 'MLA/2025/10025',
        whoMarineLicenceIsFor: 'Exmouth Oysters Ltd',
        submittedAt: '27 August 2026'
      }
    )

    const keys = $component('.govuk-summary-list__key')
      .map((_, el) => $component(el).text().trim())
      .get()
    expect(keys).toEqual([
      'Application type',
      'Status',
      'Reference number',
      'Who the marine licence is for',
      'Date submitted'
    ])

    const row = $component('.govuk-summary-list__row').eq(3)
    expect(row.find('.govuk-summary-list__value').text().trim()).toBe(
      'Exmouth Oysters Ltd'
    )
    expect(row.find('.govuk-summary-list__actions')).toHaveLength(0)
  })

  test('Should omit who the marine licence is for when not provided', () => {
    const $component = renderComponent(
      'marine-licence/application-details-card',
      {
        statusTag: '<a>Test</a>',
        applicationReference: 'TEST-REF',
        submittedAt: '01 01 2026'
      }
    )

    expect($component.html()).not.toContain('Who the marine licence is for')
  })
})
