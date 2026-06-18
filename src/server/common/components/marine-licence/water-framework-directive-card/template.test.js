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
          assessmentChanged: {
            key: { text: ASSESSMENT_CHANGED_HEADING },
            value: { text: 'Yes' }
          },
          previousAssessment: {
            key: { text: PREVIOUS_ASSESSMENT_HEADING },
            value: { text: 'Yes' }
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

  test('Should show change link when not read only', () => {
    const $comp = renderComponent(
      'marine-licence/water-framework-directive-card',
      {
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
        changeLink:
          '/marine-licence/water-framework-directive-review-your-answers',
        isReadOnly: true
      }
    )
    expect($comp.html()).not.toContain(
      '/marine-licence/water-framework-directive-review-your-answers?from=check-your-answers'
    )
  })
})
