import { getByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { exemptionNoActivityDates } from '~/tests/integration/activity-dates/fixtures.js'
import { expectDateInputValues } from '~/tests/integration/shared/expect-utils.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

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
      name: 'Save and continue'
    })

    expect(
      getByText(document, 'Enter the activity dates for this site', {
        exact: false
      })
    ).toBeInTheDocument()
  })

  test('should display correct text when same activity dates for all sites', async () => {
    const mockExemptionWithSameActivityDates = {
      ...exemptionNoActivityDates,
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes'
      }
    }

    mockExemption(mockExemptionWithSameActivityDates)
    const document = await loadPage({
      requestUrl: routes.SITE_DETAILS_ACTIVITY_DATES,
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
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no'
      }
    }

    mockExemption(mockExemptionWithDifferentActivityDates)

    const document = await loadPage({
      requestUrl: routes.SITE_DETAILS_ACTIVITY_DATES,
      server: getServer()
    })

    expect(
      getByText(document, 'Enter the activity dates for this site.', {
        exact: false
      })
    ).toBeInTheDocument()
  })
})
