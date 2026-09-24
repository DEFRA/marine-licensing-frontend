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

  describe('withhold document', () => {
    const render = (overrides = {}) =>
      renderComponent('marine-licence/construction-drawing-card', {
        siteNumber: 2,
        activityDetails: [{ requiresConstructionDrawing: true }],
        constructionDrawings: [
          { filename: 'drawing-one.pdf' },
          { filename: 'drawing-two.pdf' }
        ],
        isReadOnly: true,
        redactions: {},
        marineLicenceId: '123',
        redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
        replaceDocumentUrl:
          '/marine-licence/redaction/MLA-2026-10264/replace-document',
        csrfToken: 'test-crumb-token',
        ...overrides
      })

    const withheldSecondDrawing = {
      siteDetails: {
        1: {
          constructionDrawings: {
            1: { withholdDocument: { withhold: true } }
          }
        }
      }
    }

    const withholdForm = ($component, drawingNumber) =>
      $component(`#construction-drawing-site-2-${drawingNumber}`).find(
        '.app-withhold-location__form'
      )

    test('posts the withhold field key, site index, drawing index and flag to the redact url', () => {
      const $form = withholdForm(render(), 2)

      expect($form.attr('action')).toBe(
        '/view-marine-licence-details/test-id/redact'
      )
      expect($form.find('input[name="fieldKey"]').attr('value')).toBe(
        'siteDetails.constructionDrawings.withholdDocument'
      )
      expect($form.find('input[name="index"]').attr('value')).toBe('1')
      expect($form.find('input[name="drawingIndex"]').attr('value')).toBe('1')
      expect($form.find('input[name="withhold"]').attr('value')).toBe('true')
      expect($form.find('input[name="csrfToken"]').attr('value')).toBe(
        'test-crumb-token'
      )
    })

    test('renders the filename and a Withhold document button when not withheld', () => {
      const $component = render()
      const $card = $component('#construction-drawing-site-2-1')

      expect($card.text()).toContain('drawing-one.pdf')
      expect(withholdForm($component, 1).find('button').text()).toContain(
        'Withhold document'
      )
      expect($card.attr('data-module')).toBe('withhold-location')
    })

    test('hides the filename and offers Remove redaction on the withheld drawing only', () => {
      const $component = render({ redactions: withheldSecondDrawing })
      const $button = withholdForm($component, 2).find('button')

      expect($component('#construction-drawing-site-2-2').text()).not.toContain(
        'drawing-two.pdf'
      )
      expect($button.text()).toContain('Remove redaction')
      expect(
        withholdForm($component, 2).find('input[name="withhold"]').attr('value')
      ).toBe('false')

      expect($component('#construction-drawing-site-2-1').text()).toContain(
        'drawing-one.pdf'
      )
      expect(withholdForm($component, 1).find('button').text()).toContain(
        'Withhold document'
      )
    })

    test('renders not withheld', () => {
      const $component = render({
        redactions: {
          siteDetails: {
            1: {
              constructionDrawings: {
                1: { withholdDocument: { withhold: false } }
              }
            }
          }
        }
      })

      expect($component('#construction-drawing-site-2-2').text()).toContain(
        'drawing-two.pdf'
      )
      expect(withholdForm($component, 2).find('button').text()).toContain(
        'Withhold document'
      )

      expect($component('.govuk-summary-list__actions a')).toHaveLength(0)
      expect($component('.govuk-summary-card__actions a')).toHaveLength(0)
      expect(
        $component('#add-another-construction-drawing-site-2')
      ).toHaveLength(0)
    })

    test('links Replace document at the drawing being replaced', () => {
      const $component = render()

      const $link = $component('#construction-drawing-site-2-2').find(
        'a:contains("Replace document")'
      )

      expect($link.attr('href')).toBe(
        '/marine-licence/redaction/MLA-2026-10264/replace-document?type=construction-drawing&site=2&drawing=2'
      )
    })

    test('renders a card per uploaded drawing only', () => {
      const $component = render({
        constructionDrawings: [{ filename: 'drawing-one.pdf' }]
      })

      expect($component('.govuk-summary-card')).toHaveLength(1)
    })

    test('renders nothing when read only with no drawings uploaded', () => {
      const $component = render({ constructionDrawings: [] })

      expect($component('.govuk-summary-card')).toHaveLength(0)
    })

    test('renders no withhold control when not read only', () => {
      const $component = render({ isReadOnly: false })

      expect($component('input[name="withhold"]')).toHaveLength(0)
      expect($component('[data-module="withhold-location"]')).toHaveLength(0)
      expect($component.html()).not.toContain('Withhold document')
    })
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
