import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Site Details Card Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('marine-licence/site-details-card', {
      projectName: 'Test Marine Project'
    })
  })

  test('Should not render providing the site location card for non-internal users', () => {
    expect($component('#site-details-card')).toHaveLength(0)
  })

  test('Should render providing the site location card with correct title for internal users', () => {
    $component = renderComponent('marine-licence/site-details-card', {
      isInternalUserView: true
    })

    expect($component('.govuk-summary-card__title').text()).toContain(
      'Providing the site location'
    )
  })

  test('Should not show csv link for non-internal users', () => {
    const htmlContent = $component.html()
    expect(htmlContent).not.toContain('Location coordinates')
    expect(htmlContent).not.toContain('/marine-licence/location-csv-download/')
  })

  test('Should show csv link if the user is internal user', () => {
    $component = renderComponent('marine-licence/site-details-card', {
      isInternalUserView: true,
      marineLicenceId: '123'
    })

    const htmlContent = $component.html()
    expect(htmlContent).toContain('Location coordinates')
    expect(htmlContent).toContain('/marine-licence/location-csv-download/123')
  })
})
