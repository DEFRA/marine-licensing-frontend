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

describe('Marine Licence Site Details Card - redaction', () => {
  const redactableParams = {
    site: { siteName: 'Test site', siteNumber: 2 },
    loopIndex0: 1,
    enableRedaction: true,
    redactions: {},
    redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
    csrfToken: 'test-crumb-token'
  }

  test('renders a redaction field for the site name', () => {
    const $component = renderComponent(
      'marine-licence/site-details-card',
      redactableParams
    )

    const $field = $component('#redaction-field-siteName-1')
    expect($field).toHaveLength(1)
    expect($field.find('.app-redaction-field__input').attr('value')).toBe(
      'Test site'
    )
  })

  test('sends the field key and site index with the save', () => {
    const $component = renderComponent(
      'marine-licence/site-details-card',
      redactableParams
    )

    expect($component('input[name="fieldKey"]').attr('value')).toBe(
      'siteDetails.siteName'
    )
    expect($component('input[name="index"]').attr('value')).toBe('1')
  })

  test('renders a redaction field for the width of a circular site', () => {
    const $component = renderComponent('marine-licence/site-details-card', {
      ...redactableParams,
      coordinatesType: 'coordinates',
      site: { ...redactableParams.site, width: '50 metres' }
    })

    const $field = $component('#redaction-field-circleWidth-1')
    expect($field).toHaveLength(1)
    expect($field.find('input[name="fieldKey"]').attr('value')).toBe(
      'siteDetails.circleWidth'
    )
    expect($field.find('input[name="index"]').attr('value')).toBe('1')
    expect($field.find('.app-redaction-field__input').attr('value')).toBe(
      '50 metres'
    )
  })

  test('shows the redacted state for an already redacted site name', () => {
    const $component = renderComponent('marine-licence/site-details-card', {
      ...redactableParams,
      redactions: {
        siteDetails: {
          1: {
            siteName: {
              redactedText: 'Redacted site',
              redactedTextValue: 'Redacted site'
            }
          }
        }
      }
    })

    expect($component('.app-redaction-field__trigger').text()).toContain(
      'Change redaction'
    )
    expect($component('.app-redaction-field__input').attr('value')).toBe(
      'Redacted site'
    )
  })

  test('renders plain text when redaction is not enabled', () => {
    const $component = renderComponent('marine-licence/site-details-card', {
      ...redactableParams,
      enableRedaction: false
    })

    expect($component('.app-redaction-field')).toHaveLength(0)
    expect($component.html()).toContain('Test site')
  })
})

describe('Marine Licence Site Details Card - withhold location', () => {
  const circularSite = {
    siteNumber: 2,
    siteName: 'Test site',
    method: 'Single set of coordinates',
    coordinateSystem: 'WGS84',
    coordinates: '50.9876, -1.2345',
    width: '100m',
    siteDetailsData: {}
  }

  const withholdParams = {
    site: circularSite,
    loopIndex0: 1,
    coordinatesType: 'coordinates',
    enableRedaction: true,
    redactions: {},
    marineLicenceId: '123',
    redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
    csrfToken: 'test-crumb-token'
  }

  const withheld = { siteDetails: { 1: { withholdLocation: true } } }

  const renderCard = (params) =>
    renderComponent('marine-licence/site-details-card', {
      ...withholdParams,
      ...params
    })

  const withholdForm = ($component) =>
    $component('input[name="withhold"]').closest('form')

  test('posts the withhold field key, site index and flag to the redact url', () => {
    const $component = renderCard()
    const $form = withholdForm($component)

    expect($form.attr('action')).toBe(
      '/view-marine-licence-details/test-id/redact'
    )
    expect($form.find('input[name="fieldKey"]').attr('value')).toBe(
      'siteDetails.withholdLocation'
    )
    expect($form.find('input[name="index"]').attr('value')).toBe('1')
    expect($form.find('input[name="withhold"]').attr('value')).toBe('true')
    expect($form.find('input[name="csrfToken"]').attr('value')).toBe(
      'test-crumb-token'
    )
  })

  test('renders the map and a Withhold location button when not withheld', () => {
    const $component = renderCard()

    expect($component('.app-site-details-map')).toHaveLength(1)
    expect(withholdForm($component).find('button').text()).toContain(
      'Withhold location'
    )
  })

  test('hides the map and offers Display location when withheld', () => {
    const $component = renderCard({ redactions: withheld })
    const $button = withholdForm($component).find('button')

    expect($component('.app-site-details-map')).toHaveLength(0)
    expect($button.text()).toContain('Display location')
    expect($button.text()).not.toContain('Withhold location')
    expect(
      withholdForm($component).find('input[name="withhold"]').attr('value')
    ).toBe('false')
  })

  test('renders no withhold control when redaction is not enabled', () => {
    const $component = renderCard({ enableRedaction: false })

    expect($component('input[name="withhold"]')).toHaveLength(0)
    expect($component('[data-module="withhold-location"]')).toHaveLength(0)
    expect($component.html()).not.toContain('Withhold location')
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
      siteDetailsData: {}
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
