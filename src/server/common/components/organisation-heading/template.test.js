import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('appOrganisationHeading Component', () => {
  let $component

  test('Should render correctly with org name', () => {
    $component = renderComponent('organisation-heading', {
      applicantOrganisationName: 'Test Org'
    })

    expect($component('span').text().trim()).toBe('Test Org')
  })
})
