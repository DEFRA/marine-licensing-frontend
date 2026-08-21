import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Activity Details Card', () => {
  let $component

  const baseParams = {
    siteNumber: 1,
    index: 1,
    deleteLink: '/marine-licence/delete-activity?site=1&activity=1',
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

  test('Should show delete link when deleteLink is provided', () => {
    expect(
      $component('.govuk-summary-card__actions a').first().text().trim()
    ).toContain('Delete activity')
  })

  test('Should not show delete link when deleteLink is not provided', () => {
    const $noDeleteComponent = renderComponent(
      'marine-licence/activity-details-card',
      { ...baseParams, deleteLink: undefined }
    )
    expect($noDeleteComponent('.govuk-summary-card__actions')).toHaveLength(0)
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

  test('Should not show row-level actions when changeLink is provided', () => {
    const $c = renderComponent('marine-licence/activity-details-card', {
      ...baseParams,
      changeLink:
        '/marine-licence/review-site-details?from=check-your-answers#activity-details-site-1-activity-1'
    })
    expect($c('.govuk-summary-list__actions')).toHaveLength(0)
    const cardActionsText = $c('.govuk-summary-card__actions a').text().trim()
    expect(cardActionsText).toContain('Change')
    expect(cardActionsText).toContain('Delete activity')
  })

  test('Should not show row-level actions when isReadOnly is true', () => {
    const $c = renderComponent('marine-licence/activity-details-card', {
      ...baseParams,
      deleteLink: undefined,
      isReadOnly: true
    })
    expect($c('.govuk-summary-list__actions')).toHaveLength(0)
    expect($c('.govuk-summary-card__actions')).toHaveLength(0)
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

  describe('activity heading text by viewer type', () => {
    const paramsWithHeadings = {
      ...baseParams,
      activityDetails: {
        ...baseParams.activityDetails,
        activitySubType: 'Construction of new marine works',
        activityHeading: "What you're constructing",
        activityHeadingExternalUser: 'What the applicant is constructing'
      }
    }

    test('Should show the non-applicant heading when isApplicant is false', () => {
      const $c = renderComponent('marine-licence/activity-details-card', {
        ...paramsWithHeadings,
        isApplicant: false
      })
      expect($c.html()).toContain('What the applicant is constructing')
      expect($c.html()).not.toContain("What you're constructing")
    })

    test('Should show the original heading when isApplicant is omitted', () => {
      const $c = renderComponent(
        'marine-licence/activity-details-card',
        paramsWithHeadings
      )
      expect($c.html()).toContain("What you're constructing")
      expect($c.html()).not.toContain('What the applicant is constructing')
    })

    test('Should show the original heading when isApplicant is true', () => {
      const $c = renderComponent('marine-licence/activity-details-card', {
        ...paramsWithHeadings,
        isApplicant: true
      })
      expect($c.html()).toContain("What you're constructing")
      expect($c.html()).not.toContain('What the applicant is constructing')
    })
  })
})
