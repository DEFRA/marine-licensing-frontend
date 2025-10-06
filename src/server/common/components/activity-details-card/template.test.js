import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Activity Details Card Component', () => {
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('activity-details-card', {
        activityDescription:
          'Marine construction work involving pier foundations',
        isReadOnly: false
      })
    })

    test('Should render activity details card component', () => {
      expect($component('#activity-details-card')).toHaveLength(1)
    })

    test('Should display activity description', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain(
        'Marine construction work involving pier foundations'
      )
    })

    test('Should show Change link when not read-only', () => {
      expect(
        $component('.govuk-summary-list__actions a').text().trim()
      ).toContain('Change')
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Activity details'
      )
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('activity-details-card', {
        activityDescription:
          'Marine construction work involving pier foundations',
        isReadOnly: true
      })
    })

    test('Should render activity details card component', () => {
      expect($component('#activity-details-card')).toHaveLength(1)
    })

    test('Should display activity description', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain(
        'Marine construction work involving pier foundations'
      )
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-list__actions')).toHaveLength(0)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Activity details'
      )
    })
  })
})
