import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Activity Details Card', () => {
  let $component

  const baseParams = {
    siteNumber: 1,
    index: 1,
    activityDetails: {
      activityType: 'construction',
      activitySubType: "What you're constructing",
      activityDescription: 'Test description',
      activityDuration: 'Test duration',
      completionDate: 'Test completion',
      activityMonths: 'Test months',
      workingHours: 'Test hours'
    }
  }

  beforeEach(() => {
    $component = renderComponent(
      'marine-licence/activity-details-card',
      baseParams
    )
  })

  test('Should render the activity details card', () => {
    expect($component('#activity-details-site-1-activity-1')).toHaveLength(1)

    expect($component('.govuk-summary-card__title').text().trim()).toBe(
      'Site 1 - Activity 1'
    )
  })

  test('Should display all activity detail values', () => {
    const html = $component.html()
    expect(html).toContain("What you're constructing")
    expect(html).toContain('Test description')
    expect(html).toContain('Test duration')
    expect(html).toContain('Test completion')
    expect(html).toContain('Test months')
    expect(html).toContain('Test hours')
  })

  test('Should display correct row labels', () => {
    const keys = $component('.govuk-summary-list__key')
      .toArray()
      .map((el) => $component(el).text().trim())
    expect(keys).toEqual([
      'Type of activity',
      'Activity description',
      'Maximum duration of activity',
      'Completion date',
      'Activity limited to specific months',
      'Proposed working hours'
    ])
  })
})
