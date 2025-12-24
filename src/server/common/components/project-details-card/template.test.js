import {
  renderComponent,
  renderComponentJSDOM
} from '#src/server/test-helpers/component-helpers.js'
import { getByRole } from '@testing-library/dom'
import { validateProjectDetails } from '#tests/integration/shared/summary-card-validators.js'

describe('Project Details Card Component', () => {
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: {
          activity: {
            label: 'Deposit of a substance or object',
            purpose: 'Deposit purposes'
          },
          articleCode: '17',
          pdfDownloadUrl:
            'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
        },
        isReadOnly: false,
        isApplicantView: true
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

  describe('MCMS details', () => {
    it('Should not display the activity details section if no MCMS context', () => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        mcmsContext: { iatQueryString: 'test' },
        isReadOnly: false,
        isApplicantView: true
      })
      const htmlContent = $component.html()
      expect(htmlContent).not.toContain('Type of activity')
    })

    describe('Applicant view', () => {
      test('Should display MCMS context', () => {
        const document = renderComponentJSDOM('project-details-card', {
          projectName: 'Test Marine Project',
          mcmsContext: {
            activity: {
              label: 'Deposit of a substance or object',
              purpose: 'Scientific research purposes'
            },
            articleCode: '17',
            pdfDownloadUrl:
              'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
          },
          isReadOnly: true,
          isApplicantView: true
        })
        expect(
          getByRole(document, 'heading', {
            level: 2,
            name: 'Project summary'
          })
        ).toBeInTheDocument()
        validateProjectDetails(document, {
          projectDetails: {
            'Type of activity': 'Deposit of a substance or object',
            'The purpose of the activity': 'Scientific research purposes',
            'Why this activity is exempt':
              "Based on your answers from 'Check if you need a marine licence', your activity is exempt under Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)",
            "Your answers from 'Check if you need a marine licence'": [
              'Download a copy of your answers (PDF)',
              "If you need to change any of your 'Check if you need a marine licence' answers:",
              'Delete this project from your projects.',
              'Restart the process by checking if you need a marine licence.'
            ]
          }
        })
      })
    })

    describe('Internal user or public view', () => {
      test('Should display MCMS context', () => {
        const document = renderComponentJSDOM('project-details-card', {
          projectName: 'Test Marine Project',
          mcmsContext: {
            activity: {
              label: 'Deposit of a substance or object',
              purpose: 'Scientific research purposes'
            },
            articleCode: '17',
            pdfDownloadUrl:
              'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
          },
          isReadOnly: true,
          isApplicantView: false
        })
        expect(
          getByRole(document, 'heading', {
            level: 2,
            name: 'Project summary'
          })
        ).toBeInTheDocument()
        validateProjectDetails(document, {
          projectDetails: {
            'Type of activity': 'Deposit of a substance or object',
            'The purpose of the activity': 'Scientific research purposes',
            'Why this activity is exempt':
              "Based on the applicant's answers, their activity is exempt under Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)",
            "The applicant's answers from 'Check if you need a marine licence'":
              ['Download a copy of their answers (PDF)']
          }
        })
      })
    })
    describe('Activity purpose field', () => {
      test('Should render "The purpose of the activity" when purpose is provided', () => {
        $component = renderComponent('project-details-card', {
          projectName: 'Test Marine Project',
          mcmsContext: {
            activity: {
              label: 'Deposit of a substance or object',
              purpose: 'Scientific research purposes'
            },
            articleCode: '17',
            pdfDownloadUrl:
              'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
          },
          isReadOnly: false,
          isApplicantView: true
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
              label: 'Deposit of a substance or object'
            },
            articleCode: '17',
            pdfDownloadUrl:
              'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey…'
          },
          isReadOnly: false,
          isApplicantView: true
        })

        const htmlContent = $component.html()
        expect(htmlContent).not.toContain('The purpose of the activity')
      })
    })
  })
})
