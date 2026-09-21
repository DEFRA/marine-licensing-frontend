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
  })
})
