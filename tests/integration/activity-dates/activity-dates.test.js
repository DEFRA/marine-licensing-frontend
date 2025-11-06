import { getByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { exemptionNoActivityDates } from '~/tests/integration/activity-dates/fixtures.js'
import { expectDateInputValues } from '~/tests/integration/shared/expect-utils.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { getToday, getNextYear } from '~/tests/integration/shared/dates.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'

vi.mock('#src/server/common/helpers/save-site-details.js')

describe('Activity dates - page structure & accessibility', () => {
  const getServer = setupTestServer()

  beforeEach(() => mockExemption(exemptionNoActivityDates))

  test('should render form with correct structure when no errors', async () => {
    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer()
    })
    const emptyDate = { day: '', month: '', year: '' }

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Activity dates'
    )
    expectDateInputValues({
      document,
      fieldsetLabel: 'Start date',
      ...emptyDate
    })
    expectDateInputValues({
      document,
      fieldsetLabel: 'End date',
      ...emptyDate
    })
    getByRole(document, 'button', {
      name: 'Continue'
    })

    expect(
      getByText(document, 'Enter the activity dates', {
        exact: false
      })
    ).toBeInTheDocument()
  })

  test('should display correct text when same activity dates for all sites', async () => {
    const mockExemptionWithSameActivityDates = {
      ...exemptionNoActivityDates,
      siteDetails: [{}],
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes'
      }
    }

    mockExemption(mockExemptionWithSameActivityDates)
    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer()
    })

    expect(
      getByText(document, 'Enter the activity dates for all sites', {
        exact: false
      })
    ).toBeInTheDocument()
  })

  test('should display correct text when variable activity dates for sites.', async () => {
    const mockExemptionWithDifferentActivityDates = {
      ...exemptionNoActivityDates,
      siteDetails: [{}],
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no'
      }
    }

    mockExemption(mockExemptionWithDifferentActivityDates)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer()
    })

    expect(
      getByText(document, 'Enter the activity dates for this site.', {
        exact: false
      })
    ).toBeInTheDocument()
  })

  test('should have correct page content for single site journey', async () => {
    const mockExemptionSingleSite = {
      ...exemptionNoActivityDates,
      siteDetails: [{}],
      multipleSiteDetails: {
        multipleSitesEnabled: false
      }
    }

    mockExemption(mockExemptionSingleSite)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.MULTIPLE_SITES_CHOICE)
  })

  test('should have correct page content for multiple site journey', async () => {
    const mockExemptionSingleSite = {
      ...exemptionNoActivityDates,
      siteDetails: [{}],
      multipleSiteDetails: {
        multipleSitesEnabled: true
      }
    }

    mockExemption(mockExemptionSingleSite)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.SAME_ACTIVITY_DATES)

    expect(
      getByText(document, 'Enter the activity dates for this site.', {
        exact: false
      })
    ).toBeInTheDocument()
  })

  test('should have correct page content for multiple site journey with same dates', async () => {
    const mockExemptionSingleSite = {
      ...exemptionNoActivityDates,
      siteDetails: [{}],
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes'
      }
    }

    mockExemption(mockExemptionSingleSite)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DATES,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.SAME_ACTIVITY_DATES)

    expect(
      getByText(document, 'Enter the activity dates for all sites.', {
        exact: false
      })
    ).toBeInTheDocument()
  })

  test('should display Save and continue button when action parameter is present', async () => {
    const document = await loadPage({
      requestUrl: `${routes.ACTIVITY_DATES}?action=add`,
      server: getServer()
    })

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  test('should redirect to review site details after submit when action parameter is present', async () => {
    const { updateExemptionSiteDetails } = mockExemption(
      exemptionNoActivityDates
    )
    const today = getToday()
    const nextYear = getNextYear()

    const response = await makePostRequest({
      url: `${routes.ACTIVITY_DATES}?action=add`,
      server: getServer(),
      formData: {
        'activity-start-date-day': today.day,
        'activity-start-date-month': today.month,
        'activity-start-date-year': today.year,
        'activity-end-date-day': today.day,
        'activity-end-date-month': today.month,
        'activity-end-date-year': nextYear
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/exemption/review-site-details#site-details-1'
    )

    expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      0,
      'activityDates',
      expect.any(Object)
    )
    expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
  })

  test('should redirect to review site details after submit when action parameter is present for specific site', async () => {
    const { updateExemptionSiteDetails } = mockExemption({
      ...exemptionNoActivityDates,
      siteDetails: [{}, {}]
    })
    const today = getToday()
    const nextYear = getNextYear()

    const response = await makePostRequest({
      url: `${routes.ACTIVITY_DATES}?site=2&action=change`,
      server: getServer(),
      formData: {
        'activity-start-date-day': today.day,
        'activity-start-date-month': today.month,
        'activity-start-date-year': today.year,
        'activity-end-date-day': today.day,
        'activity-end-date-month': today.month,
        'activity-end-date-year': nextYear
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/exemption/review-site-details#site-details-2'
    )

    expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      1,
      'activityDates',
      expect.any(Object)
    )
    expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
  })

  test('should redirect to correct page after submit', async () => {
    const { updateExemptionSiteDetails } = mockExemption({
      ...exemptionNoActivityDates,
      siteDetails: [{}, {}]
    })
    const today = getToday()
    const nextYear = getNextYear()

    const response = await makePostRequest({
      url: routes.ACTIVITY_DATES,
      server: getServer(),
      formData: {
        'activity-start-date-day': today.day,
        'activity-start-date-month': today.month,
        'activity-start-date-year': today.year,
        'activity-end-date-day': today.day,
        'activity-end-date-month': today.month,
        'activity-end-date-year': nextYear
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/activity-description')

    expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      0,
      'activityDates',
      expect.any(Object)
    )
    expect(saveSiteDetailsToBackend).not.toHaveBeenCalled()
  })
})
