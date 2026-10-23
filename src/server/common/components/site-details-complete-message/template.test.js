import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Site details complete message component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent('site-details-complete-message')
  })

  test('renders both lines inside inset text', () => {
    const paragraphs = $component('.govuk-inset-text p')

    expect(paragraphs).toHaveLength(2)
    expect(paragraphs.eq(0).text().trim()).toBe(
      "The site details you've provided are saved."
    )
    expect(paragraphs.eq(1).text().trim()).toBe(
      'You can return to this page and make changes at any time before you send your information.'
    )
  })

  test('renders the lines with no gap between them', () => {
    $component('.govuk-inset-text p').each((_, paragraph) => {
      expect($component(paragraph).hasClass('govuk-!-margin-bottom-0')).toBe(
        true
      )
    })
  })
})
