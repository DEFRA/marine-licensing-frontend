import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Activity Dates Card Component', () => {
  /** @type {CheerioAPI} */
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('activity-dates-card', {
        activityDates: {
          start: '2024-01-15',
          end: '2024-06-30'
        },
        isReadOnly: false
      })
    })

    test('Should render activity dates card component', () => {
      expect($component('#activity-dates-card')).toHaveLength(1)
    })

    test('Should display activity dates', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('15 January 2024')
      expect(htmlContent).toContain('30 June 2024')
    })

    test('Should show Change link when not read-only', () => {
      expect(
        $component('.govuk-summary-card__actions a').text().trim()
      ).toContain('Change')
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Activity dates'
      )
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('activity-dates-card', {
        activityDates: {
          start: '2024-01-15',
          end: '2024-06-30'
        },
        isReadOnly: true
      })
    })

    test('Should render activity dates card component', () => {
      expect($component('#activity-dates-card')).toHaveLength(1)
    })

    test('Should display activity dates', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('15 January 2024')
      expect(htmlContent).toContain('30 June 2024')
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-card__actions')).toHaveLength(0)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Activity dates'
      )
    })
  })
})
