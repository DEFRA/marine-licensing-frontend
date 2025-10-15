import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'
import { within } from '@testing-library/dom'

describe('appOrganisationHeading Component', () => {
  let $component

  test('Should render application organisation name', () => {
    $component = renderComponentJSDOM('organisation-heading', {
      orgOrUserName: 'Test Org'
    })

    expect(within($component).getByText('Test Org')).toBeInTheDocument()
  })

  test('should not render the organisation name if it is not provided', () => {
    $component = renderComponentJSDOM('organisation-heading', {
      orgOrUserName: undefined
    })

    expect(within($component).queryByText('Test Org')).not.toBeInTheDocument()
  })

  test('should show a Change who you’re representing link if param set to true', () => {
    $component = renderComponentJSDOM('organisation-heading', {
      orgOrUserName: 'Test Org',
      showChangeOrganisationLink: true
    })
    expect(
      within($component).getByRole('link', {
        name: 'Change who you’re representing'
      })
    ).toBeInTheDocument()
  })

  test('should not show a Change who you’re representing link if param set to false', () => {
    $component = renderComponentJSDOM('organisation-heading', {
      orgOrUserName: 'Test Org',
      hasMultipleOrganisations: false
    })
    expect(
      within($component).queryByRole('link', {
        name: 'Change who you’re representing'
      })
    ).not.toBeInTheDocument()
  })
})
