import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Site Location Card', () => {
  test('should render "File upload" when coordinatesType is file', () => {
    const $component = renderComponent('marine-licence/site-location-card', {
      coordinatesType: 'file'
    })
    expect($component('.govuk-summary-list__value').text()).toContain(
      'File upload'
    )
  })

  test('should render manual coordinates text when coordinatesType is not file', () => {
    const $component = renderComponent('marine-licence/site-location-card', {
      coordinatesType: 'coordinates'
    })
    expect($component('.govuk-summary-list__value').text()).toContain(
      'Enter the coordinates of the site manually'
    )
  })

  test('should not render Change link when changeLink is not provided', () => {
    const $component = renderComponent('marine-licence/site-location-card', {
      coordinatesType: 'coordinates'
    })
    expect($component('.govuk-summary-card__actions a')).toHaveLength(0)
  })

  test('should render Change link when changeLink is provided', () => {
    const $component = renderComponent('marine-licence/site-location-card', {
      coordinatesType: 'coordinates',
      changeLink: '/review-site-details?from=check-your-answers'
    })
    expect($component('.govuk-summary-card__actions a').text()).toContain(
      'Change'
    )
  })
})
