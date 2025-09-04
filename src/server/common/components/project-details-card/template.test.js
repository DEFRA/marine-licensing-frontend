import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Project Details Card Component', () => {
  /** @type {CheerioAPI} */
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: {
          activityType: {
            value: 'DEPOSIT',
            label: 'Deposit of a substance or object'
          },
          article: '17',
          pdfDownloadUrl:
            'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
        },
        isReadOnly: false
      })
    })

    test('Should render project details card component', () => {
      expect($component('#project-details-card')).toHaveLength(1)
    })

    test('Should display project name', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Test Marine Project')
    })

    test('Should show Change link when not read-only', () => {
      expect(
        $component('.govuk-summary-list__actions a').text().trim()
      ).toContain('Change')
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Project summary'
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
      expect(htmlContent).toContain('Deposit of a substance or object')
      expect(htmlContent).toContain('Why this activity is exempt')
      expect(htmlContent).toContain(
        "Based on your answers from 'Check if you need a marine licence', your article is exempt"
      )
      expect(htmlContent).toContain(
        'Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)'
      )
      expect(htmlContent).toContain(
        "Your answers from 'Check if you need a marine licence'"
      )
      expect(htmlContent).toContain('Download a copy of your answers (PDF)')
      expect(htmlContent).toContain(
        "If you need to change any of your 'Check if you need a marine licence' answers:"
      )
      expect(htmlContent).toContain('Delete this project from your projects.')
      expect(htmlContent).toContain(
        'Restart the process by checking if you need a marine licence.'
      )
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        isReadOnly: true
      })
    })

    test('Should render project details card component', () => {
      expect($component('#project-details-card')).toHaveLength(1)
    })

    test('Should display project name', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Test Marine Project')
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-card__actions')).toHaveLength(0)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Project summary'
      )
    })
  })
})

/**
 * @import { CheerioAPI } from 'cheerio'
 */
