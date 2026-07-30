import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Construction Drawing Card', () => {
  test('renders a drawing card per qualifying activity, in order', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [
          { requiresConstructionDrawing: true },
          { requiresConstructionDrawing: false },
          { requiresConstructionDrawing: true }
        ]
      }
    )

    const cardIds = $component('.govuk-summary-card')
      .toArray()
      .map((el) => $component(el).attr('id'))

    expect(cardIds).toEqual([
      'construction-drawing-site-1-activity-1',
      'construction-drawing-site-1-activity-3'
    ])

    expect(
      $component(
        '#construction-drawing-site-1-activity-1 .govuk-summary-card__title'
      )
        .text()
        .trim()
    ).toBe('Site 1 - Construction drawing 1')
  })

  test('renders the "Add" link for each drawing card pointing at the upload-construction-drawing route', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 2,
        activityDetails: [{ requiresConstructionDrawing: true }]
      }
    )

    const link = $component(
      '#construction-drawing-site-2-activity-1 .govuk-summary-list__actions a'
    )
    expect(link.attr('href')).toBe(
      'upload-construction-drawing?site=2&activity=1&action=add'
    )
  })

  test('renders "Add another construction drawing" button linking to the first qualifying activity', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [
          { requiresConstructionDrawing: false },
          { requiresConstructionDrawing: true }
        ]
      }
    )

    const button = $component('#add-another-construction-drawing-site-1')
    expect(button).toHaveLength(1)
    expect(button.attr('href')).toBe(
      'upload-construction-drawing?site=1&activity=2'
    )
  })

  test('renders nothing when no activity requires a drawing', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [
          { requiresConstructionDrawing: false },
          { requiresConstructionDrawing: false }
        ]
      }
    )

    expect($component('.govuk-summary-card')).toHaveLength(0)
    expect($component('#add-another-construction-drawing-site-1')).toHaveLength(
      0
    )
  })
})
