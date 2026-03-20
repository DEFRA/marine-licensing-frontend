import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Other Permissions Card Component', () => {
  let $component

  const baseParams = {
    specialLegalPowers: {
      agree: 'yes',
      details: 'We have statutory powers under the Marine Act.'
    }
  }

  beforeEach(() => {
    $component = renderComponent(
      'marine-licence/other-permissions-card',
      baseParams
    )
  })

  test('Should render other permissions card component', () => {
    expect($component('#other-permissions-card')).toHaveLength(1)
  })

  test('Should display details when agree is yes', () => {
    expect($component.html()).toContain(
      'We have statutory powers under the Marine Act.'
    )
  })

  test('Should have correct card title', () => {
    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Other permissions'
    )
  })

  test('Should display "No" and not show details when agree is no', () => {
    const params = {
      specialLegalPowers: {
        agree: 'no',
        details: 'Should not be shown'
      },
      isApplicantView: true
    }
    const $comp = renderComponent(
      'marine-licence/other-permissions-card',
      params
    )
    expect($comp.html()).toContain('No')
    expect($comp.html()).not.toContain('Should not be shown')
  })
})
