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

describe('Marine Licence Site Details Card - Change link', () => {
  const siteParams = {
    site: {
      siteNumber: 1,
      siteName: 'Test site',
      method: 'Single set of coordinates',
      coordinateSystem: 'WGS84',
      coordinates: '50.9876, -1.2345',
      width: '100m',
      siteDetailsData: '{}'
    },
    coordinatesType: 'coordinates'
  }

  test('Should not render Change link when changeLink is not provided', () => {
    const $component = renderComponent(
      'marine-licence/site-details-card',
      siteParams
    )
    expect($component('.govuk-summary-card__actions a').text()).not.toContain(
      'Change'
    )
  })

  test('Should render Change link when changeLink is provided', () => {
    const $component = renderComponent('marine-licence/site-details-card', {
      ...siteParams,
      changeLink: '/review-site-details?from=check-your-answers#site-details-1'
    })
    expect($component('.govuk-summary-card__actions a').text()).toContain(
      'Change'
    )
  })
})
