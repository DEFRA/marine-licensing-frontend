import { renderComponent } from '#src/server/test-helpers/component-helpers.js'
import {
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING,
  PREVIOUS_ASSESSMENT_HEADING,
  ASSESSMENT_CHANGED_HEADING,
  FILE_UPLOAD_HEADING
} from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'

describe('Marine Licence Water Framework Directive Component', () => {
  let $component

  beforeEach(() => {
    $component = renderComponent(
      'marine-licence/water-framework-directive-card',
      {
        waterFrameworkDirectiveData: {
          nauticalMile: {
            key: { text: NAUTICAL_MILE_HEADING },
            value: { text: 'Yes' }
          },
          excludedActivities: {
            key: { text: EXCLUDED_ACTIVITIES_HEADING },
            value: { text: 'No' }
          },
          uploadedFile: {
            key: { text: FILE_UPLOAD_HEADING },
            value: { text: 'test-upload-id' }
          }
        }
      }
    )
  })

  test('Should render card component', () => {
    expect($component('#water-framework-directive-card')).toHaveLength(1)

    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Water Framework Directive assessment'
    )
  })

  test('Should display all details', () => {
    expect($component.html()).toContain(NAUTICAL_MILE_HEADING)
    expect($component.html()).toContain(EXCLUDED_ACTIVITIES_HEADING)
    expect($component.html()).toContain(PREVIOUS_ASSESSMENT_HEADING)
    expect($component.html()).toContain(ASSESSMENT_CHANGED_HEADING)
    expect($component.html()).toContain(FILE_UPLOAD_HEADING)
  })

  test('Should not render when nautical mile data is absent', () => {
    const $comp = renderComponent(
      'marine-licence/water-framework-directive-card',
      {
        waterFrameworkDirectiveData: {}
      }
    )

    expect($comp('#water-framework-directive-card')).toHaveLength(0)
  })

  test('Should show change link when not read only', () => {
    const $comp = renderComponent(
      'marine-licence/water-framework-directive-card',
      {
        waterFrameworkDirectiveData: {
          nauticalMile: {
            key: { text: NAUTICAL_MILE_HEADING },
            value: { text: 'Yes' }
          }
        },
        changeLink:
          '/marine-licence/water-framework-directive-review-your-answers',
        isReadOnly: false
      }
    )
    expect($comp.html()).toContain(
      '/marine-licence/water-framework-directive-review-your-answers?from=check-your-answers'
    )
  })

  test('Should not show change link when read only', () => {
    const $comp = renderComponent(
      'marine-licence/water-framework-directive-card',
      {
        waterFrameworkDirectiveData: {
          nauticalMile: {
            key: { text: NAUTICAL_MILE_HEADING },
            value: { text: 'Yes' }
          }
        },
        changeLink:
          '/marine-licence/water-framework-directive-review-your-answers',
        isReadOnly: true
      }
    )
    expect($comp.html()).not.toContain(
      '/marine-licence/water-framework-directive-review-your-answers?from=check-your-answers'
    )
  })

  describe('redaction', () => {
    const waterFrameworkDirectiveData = {
      nauticalMile: {
        key: { text: NAUTICAL_MILE_HEADING },
        value: { text: 'Yes' }
      },
      excludedActivities: {
        key: { text: EXCLUDED_ACTIVITIES_HEADING },
        value: { text: 'No' }
      }
    }

    const render = (overrides = {}) =>
      renderComponent('marine-licence/water-framework-directive-card', {
        waterFrameworkDirectiveData,
        isReadOnly: true,
        enableRedaction: true,
        redactions: {},
        redactionSaveUrl: '/view-marine-licence-details/test-id/redact',
        replaceDocumentUrl:
          '/marine-licence/redaction/MLA-2026-10264/replace-document',
        csrfToken: 'test-crumb-token',
        ...overrides
      })

    test.each([
      ['nauticalMile', 'Yes'],
      ['excludedActivities', 'No']
    ])('renders a redaction field for %s', (fieldName, text) => {
      const $component = render()

      const $field = $component(
        `#redaction-field-waterFrameworkDirective-${fieldName}`
      )
      expect($field).toHaveLength(1)
      expect($field.find('input[name="fieldKey"]').attr('value')).toBe(
        `waterFrameworkDirective.${fieldName}`
      )
      expect($field.find('.app-redaction-field__input').attr('value')).toBe(
        text
      )
    })

    test('renders plain text when redaction is not enabled', () => {
      const $component = render({ enableRedaction: false })

      expect($component('.app-redaction-field')).toHaveLength(0)
      expect($component.html()).toContain(NAUTICAL_MILE_HEADING)
    })

    describe('withhold uploaded file', () => {
      const uploadedFile = {
        key: { text: FILE_UPLOAD_HEADING },
        value: { text: 'assessment.pdf' }
      }

      const renderWithFile = (overrides = {}) =>
        render({
          waterFrameworkDirectiveData: {
            ...waterFrameworkDirectiveData,
            uploadedFile
          },
          ...overrides
        })

      const withheld = {
        waterFrameworkDirective: { withholdDocument: { withhold: true } }
      }

      const withheldWithReplacement = {
        waterFrameworkDirective: {
          withholdDocument: {
            withhold: true,
            redactedDocument: {
              filename: 'redacted-assessment.odt',
              url: '/download/redacted-assessment.odt'
            }
          }
        }
      }

      const withholdForm = ($component) =>
        $component('input[name="withhold"]').closest('form')

      test('posts the withhold field key and flag to the redact url', () => {
        const $form = withholdForm(renderWithFile())

        expect($form.attr('action')).toBe(
          '/view-marine-licence-details/test-id/redact'
        )
        expect($form.find('input[name="fieldKey"]').attr('value')).toBe(
          'waterFrameworkDirective.withholdDocument'
        )
        expect($form.find('input[name="withhold"]').attr('value')).toBe('true')
        expect($form.find('input[name="csrfToken"]').attr('value')).toBe(
          'test-crumb-token'
        )
      })

      test('renders the filename and a Withhold document button when not withheld', () => {
        const $component = renderWithFile()

        expect($component.html()).toContain('assessment.pdf')
        expect(withholdForm($component).find('button').text()).toContain(
          'Withhold document'
        )
        expect($component('[data-module="withhold-location"]')).toHaveLength(1)
      })

      test('hides the filename and offers Remove redaction when withheld', () => {
        const $component = renderWithFile({ redactions: withheld })
        const $button = withholdForm($component).find('button')

        expect($component.html()).not.toContain('assessment.pdf')
        expect($button.text()).toContain('Remove redaction')
        expect($button.text()).not.toContain('Withhold document')
        expect(
          withholdForm($component).find('input[name="withhold"]').attr('value')
        ).toBe('false')
      })

      test('links the replacement document above Remove redaction', () => {
        const $component = renderWithFile({
          redactions: withheldWithReplacement
        })

        const $link = $component('.app-withhold__redacted-document')
        expect($link.text()).toBe('redacted-assessment.odt')
      })

      test('renders no replacement link when nothing has replaced the document', () => {
        const $component = renderWithFile({ redactions: withheld })

        expect($component('.app-withhold__redacted-document')).toHaveLength(0)
      })

      test('links Replace document at the assessment upload', () => {
        const $component = renderWithFile()

        const $link = $component('a:contains("Replace document")')

        expect($link.attr('href')).toBe(
          '/marine-licence/redaction/MLA-2026-10264/replace-document?type=water-framework-directive'
        )
      })

      test('renders no withhold control when redaction is not enabled', () => {
        const $component = renderWithFile({ enableRedaction: false })

        expect($component.html()).toContain('assessment.pdf')
        expect($component('input[name="withhold"]')).toHaveLength(0)
        expect($component('[data-module="withhold-location"]')).toHaveLength(0)
      })

      test('hides the file row when withheld and redaction is not enabled', () => {
        const $component = renderWithFile({
          enableRedaction: false,
          redactions: withheld
        })

        expect($component.html()).not.toContain('assessment.pdf')
      })

      test('adds no withhold module when there is no uploaded file', () => {
        const $component = render()

        expect($component('[data-module="withhold-location"]')).toHaveLength(0)
      })
    })
  })
})
