import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Fee Estimate Card Component', () => {
  let $component

  const changeLink = 'marine-licence/fee-estimate'

  beforeEach(() => {
    $component = renderComponent('marine-licence/fee-estimate-card')
  })

  test('Should render fee estimate crd component', () => {
    expect($component('#fee-estimate-card')).toHaveLength(1)
  })

  test('Should display correct text', () => {
    const $comp = renderComponent('marine-licence/fee-estimate-card', {
      changeLink
    })

    expect($comp.html()).toContain('Maximum application fee estimate accepted')
    expect($comp.html()).toContain(
      '£1,400 (Does not include potential post-consent monitoring of up to £750)'
    )

    const cardActionsText = $comp('.govuk-summary-list__actions a')
      .text()
      .trim()
    expect(cardActionsText).toContain('Change')
    expect(cardActionsText).toContain('Change fee estimate (Fee estimate)')

    expect($comp.html()).toContain(`${changeLink}?from=check-your-answers`)
  })
})
