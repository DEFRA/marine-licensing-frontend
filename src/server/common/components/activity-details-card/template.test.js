import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Activity Details Card Component', () => {
  let $component

  describe('Multi-site journey with same activity dates and description (both "yes")', () => {
    beforeEach(() => {
      $component = renderComponent('activity-details-card', {
        activityDetailsData: {
          multipleSitesEnabled: true,
          sameActivityDates: 'Yes',
          activityDates: '1 January 2025 to 31 January 2025',
          sameActivityDescription: 'Yes',
          activityDescription:
            'Marine construction work involving pier foundations'
        },
        isReadOnly: false
      })
    })

    test('Should render activity details card component', () => {
      expect($component('#activity-details-card')).toHaveLength(1)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Activity details'
      )
    })

    test('Should display all four fields', () => {
      const keys = $component('.govuk-summary-list__key')
        .map((i, el) => $component(el).text().trim())
        .get()

      expect(keys).toContain('Are the activity dates the same for every site?')
      expect(keys).toContain('Activity dates')
      expect(keys).toContain(
        'Is the activity description the same for every site?'
      )
      expect(keys).toContain('Activity description')
    })

    test('Should display correct values', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Yes')
      expect(htmlContent).toContain('1 January 2025 to 31 January 2025')
      expect(htmlContent).toContain(
        'Marine construction work involving pier foundations'
      )
    })

    test('Should show card-level Change link when not read-only', () => {
      const changeLink = $component('.govuk-summary-card__actions a')
      expect(changeLink).toHaveLength(1)
      expect(changeLink.text().trim()).toContain('Change')
    })
  })

  describe('Multi-site journey with different activity dates and descriptions (both "no")', () => {
    beforeEach(() => {
      $component = renderComponent('activity-details-card', {
        activityDetailsData: {
          multipleSitesEnabled: true,
          sameActivityDates: 'No',
          sameActivityDescription: 'No'
        },
        isReadOnly: false
      })
    })

    test('Should render activity details card component', () => {
      expect($component('#activity-details-card')).toHaveLength(1)
    })

    test('Should display only the two question fields', () => {
      const keys = $component('.govuk-summary-list__key')
        .map((i, el) => $component(el).text().trim())
        .get()

      expect(keys).toContain('Are the activity dates the same for every site?')
      expect(keys).toContain(
        'Is the activity description the same for every site?'
      )
      expect(keys).not.toContain('Activity dates')
      expect(keys).not.toContain('Activity description')
    })

    test('Should display "No" for both questions', () => {
      const values = $component('.govuk-summary-list__value')
        .map((i, el) => $component(el).text().trim())
        .get()

      expect(values).toEqual(['No', 'No'])
    })
  })

  describe('Multi-site journey - mixed responses', () => {
    test('Should show activity dates when sameActivityDates is Yes', () => {
      $component = renderComponent('activity-details-card', {
        activityDetailsData: {
          multipleSitesEnabled: true,
          sameActivityDates: 'Yes',
          activityDates: '15 June 2025 to 30 August 2025',
          sameActivityDescription: 'No'
        },
        isReadOnly: false
      })

      const keys = $component('.govuk-summary-list__key')
        .map((i, el) => $component(el).text().trim())
        .get()

      expect(keys).toContain('Activity dates')
      expect(keys).not.toContain('Activity description')
    })

    test('Should show activity description when sameActivityDescription is Yes', () => {
      $component = renderComponent('activity-details-card', {
        activityDetailsData: {
          multipleSitesEnabled: true,
          sameActivityDates: 'No',
          sameActivityDescription: 'Yes',
          activityDescription: 'Dredging operations'
        },
        isReadOnly: false
      })

      const keys = $component('.govuk-summary-list__key')
        .map((i, el) => $component(el).text().trim())
        .get()

      expect(keys).not.toContain('Activity dates')
      expect(keys).toContain('Activity description')
    })
  })

  describe('Single-site journey', () => {
    test('Should not render card when multipleSitesEnabled is false', () => {
      $component = renderComponent('activity-details-card', {
        activityDetailsData: {
          multipleSitesEnabled: false,
          sameActivityDates: 'Yes',
          sameActivityDescription: 'Yes'
        },
        isReadOnly: false
      })

      expect($component('#activity-details-card')).toHaveLength(0)
    })

    test('Should not render card when activityDetailsData is missing', () => {
      $component = renderComponent('activity-details-card', {
        isReadOnly: false
      })

      expect($component('#activity-details-card')).toHaveLength(0)
    })
  })

  describe('Read-only mode', () => {
    beforeEach(() => {
      $component = renderComponent('activity-details-card', {
        activityDetailsData: {
          multipleSitesEnabled: true,
          sameActivityDates: 'Yes',
          activityDates: '1 January 2025 to 31 January 2025',
          sameActivityDescription: 'Yes',
          activityDescription: 'Marine construction work'
        },
        isReadOnly: true
      })
    })

    test('Should render activity details card component', () => {
      expect($component('#activity-details-card')).toHaveLength(1)
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-card__actions')).toHaveLength(0)
    })

    test('Should still display all field content', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain(
        'Are the activity dates the same for every site?'
      )
      expect(htmlContent).toContain('1 January 2025 to 31 January 2025')
      expect(htmlContent).toContain('Marine construction work')
    })
  })
})
