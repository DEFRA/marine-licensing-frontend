import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Project Details Card Component', () => {
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: {
          activity: {
            value: 'DEPOSIT',
            label: 'Deposit of a substance or object',
            purpose: 'Deposit purposes'
          },
          articleCode: '17',
          pdfDownloadUrl:
            'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
        },
        isReadOnly: false,
        isInternalUser: false
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
        "Based on your answers from 'Check if you need a marine licence', your activity is exempt"
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

    test('Should not display project name', () => {
      const htmlContent = $component.html()
      expect(htmlContent).not.toContain('Test Marine Project')
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

  describe('Internal user', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: {
          activity: {
            code: 'DEPOSIT',
            label: 'Deposit of a substance or object',
            purpose: 'Scientific research purposes'
          },
          articleCode: '17',
          pdfDownloadUrl:
            'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
        },
        isReadOnly: false,
        isInternalUser: true
      })
    })

    test('Should display all activity detail rows', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Type of activity')
      expect(htmlContent).toContain('Deposit of a substance or object')
      expect(htmlContent).toContain('Why this activity is exempt')
      expect(htmlContent).toContain(
        "Based on the applicant's answers, their activity is exempt"
      )
      expect(htmlContent).toContain(
        'Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)'
      )
    })
  })

  describe('Activity purpose field', () => {
    test('Should render "The purpose of the activity" when purpose is provided', () => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: {
          activity: {
            value: 'DEPOSIT',
            label: 'Deposit of a substance or object',
            purpose: 'Scientific research purposes'
          },
          articleCode: '17',
          pdfDownloadUrl:
            'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
        },
        isReadOnly: false,
        isInternalUser: false
      })

      const htmlContent = $component.html()
      expect(htmlContent).toContain('The purpose of the activity')
      expect(htmlContent).toContain('Scientific research purposes')
    })

    test('Should not render "The purpose of the activity" when purpose is not provided', () => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: {
          activity: {
            value: 'DEPOSIT',
            label: 'Deposit of a substance or object'
          },
          articleCode: '17',
          pdfDownloadUrl:
            'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
        },
        isReadOnly: false,
        isInternalUser: false
      })

      const htmlContent = $component.html()
      expect(htmlContent).not.toContain('The purpose of the activity')
    })
  })
})
