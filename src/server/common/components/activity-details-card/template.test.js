import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Activity Details Card Component', () => {
  /** @type {CheerioAPI} */
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

    test('Should show full instructions for changing marine licence answers', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('If you need to change any of your')
      expect(htmlContent).toContain('Delete this project from your projects')
      expect(htmlContent).toContain('Restart the process by checking')
    })

    test('Should display all activity detail rows', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Type of activity')
      expect(htmlContent).toContain('The purpose of the activity')
      expect(htmlContent).toContain('What the activity involves')
      expect(htmlContent).toContain('Why this activity is exempt')
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

    test('Should only show PDF download link without additional instructions', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Download a copy of your answers (PDF)')
      expect(htmlContent).not.toContain('If you need to change any of your')
      expect(htmlContent).not.toContain(
        'Delete this project from your projects'
      )
    })

    test('Should display all activity detail rows', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Type of activity')
      expect(htmlContent).toContain('The purpose of the activity')
      expect(htmlContent).toContain('What the activity involves')
      expect(htmlContent).toContain('Why this activity is exempt')
    })
  })
})
