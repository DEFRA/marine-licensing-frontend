import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Construction Drawing Card', () => {
  test('renders a single drawing card when no drawings have been added yet', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [
          { requiresConstructionDrawing: true },
          { requiresConstructionDrawing: false }
        ]
      }
    )

    const cardIds = $component('.govuk-summary-card')
      .toArray()
      .map((el) => $component(el).attr('id'))

    expect(cardIds).toEqual(['construction-drawing-site-1-1'])

    expect(
      $component('#construction-drawing-site-1-1 .govuk-summary-card__title')
        .text()
        .trim()
    ).toBe('Site 1 - Construction drawing 1')
  })

  test('renders the "Add" link pointing at the upload-construction-drawing route', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 2,
        activityDetails: [{ requiresConstructionDrawing: true }]
      }
    )

    const link = $component(
      '#construction-drawing-site-2-1 .govuk-summary-list__actions a'
    )
    expect(link.text()).toContain('Add')
    expect(link.attr('href')).toBe(
      'upload-construction-drawing?site=2&drawing=1&action=add'
    )
  })

  test('renders the "Change" link and filename for an uploaded drawing', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [{ requiresConstructionDrawing: true }],
        constructionDrawings: [{ filename: 'tech-drawing.pdf' }]
      }
    )

    const row = $component('#construction-drawing-site-1-1')
    expect(row.text()).toContain('tech-drawing.pdf')

    const link = row.find('.govuk-summary-list__actions a')
    expect(link.text()).toContain('Change')
    expect(link.attr('href')).toBe(
      'upload-construction-drawing?site=1&drawing=1&action=change'
    )
  })

  test('renders a card per drawing, numbered sequentially, with a delete link from the second drawing onwards', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [{ requiresConstructionDrawing: true }],
        constructionDrawings: [
          { filename: 'drawing-one.pdf' },
          { filename: 'drawing-two.pdf' },
          {}
        ]
      }
    )

    const cardIds = $component('.govuk-summary-card')
      .toArray()
      .map((el) => $component(el).attr('id'))

    expect(cardIds).toEqual([
      'construction-drawing-site-1-1',
      'construction-drawing-site-1-2',
      'construction-drawing-site-1-3'
    ])

    expect(
      $component('#construction-drawing-site-1-1 .govuk-summary-card__actions')
        .length
    ).toBe(0)

    const secondCardDeleteLink = $component(
      '#construction-drawing-site-1-2 .govuk-summary-card__actions a'
    )
    expect(secondCardDeleteLink.text()).toContain('Delete file upload')
    expect(secondCardDeleteLink.attr('href')).toBe(
      'delete-construction-drawing?site=1&drawing=2'
    )

    const thirdCardDeleteLink = $component(
      '#construction-drawing-site-1-3 .govuk-summary-card__actions a'
    )
    expect(thirdCardDeleteLink.attr('href')).toBe(
      'delete-construction-drawing?site=1&drawing=3'
    )
  })

  test('renders "Add another construction drawing" as a POST submit button, not a link', () => {
    const $component = renderComponent(
      'marine-licence/construction-drawing-card',
      {
        siteNumber: 1,
        activityDetails: [{ requiresConstructionDrawing: true }],
        csrfToken: 'test-csrf-token'
      }
    )

    const button = $component('#add-another-construction-drawing-site-1')
    const form = button.closest('form')

    expect(button.attr('href')).toBeUndefined()
    expect(button.attr('type')).toBe('submit')
    expect(button.attr('name')).toBe('addConstructionDrawing')
    expect(form.attr('method')).toBe('POST')
    expect(form.find('input[name="csrfToken"]').attr('value')).toBe(
      'test-csrf-token'
    )
    expect(form.find('input[name="siteNumber"]').attr('value')).toBe('1')
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
