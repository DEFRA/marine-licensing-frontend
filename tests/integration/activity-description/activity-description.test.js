import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { exemptionNoActivityDescription } from '~/tests/integration/activity-description/fixtures.js'
import { expectInputValue } from '~/tests/integration/shared/expect-utils.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Activity description - page structure & accessibility', () => {
  const getServer = setupTestServer()

  beforeEach(() => mockExemption(exemptionNoActivityDescription))

  test('should render form with correct structure when no errors', async () => {
    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DESCRIPTION,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Activity description'
    )

    getByRole(document, 'button', {
      name: 'Save and continue'
    })

    expectInputValue({
      document,
      inputLabel: 'Activity description',
      value: ''
    })

    expect(
      getByRole(document, 'link', {
        name: 'Back'
      })
    ).toHaveAttribute('href', routes.TASK_LIST)

    expect(
      queryByRole(document, 'link', {
        name: 'Cancel'
      })
    ).toBeInTheDocument()
  })

  test('should have correct page content for single site journey', async () => {
    const mockExemptionSingleSite = {
      ...exemptionNoActivityDescription,
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: false
      }
    }

    mockExemption(mockExemptionSingleSite)

    const document = await loadPage({
      requestUrl: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.SITE_DETAILS_ACTIVITY_DATES)
  })

  test('should have correct page content for multiple site journey', async () => {
    const mockExemptionSingleSite = {
      ...exemptionNoActivityDescription,
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: true
      }
    }

    mockExemption(mockExemptionSingleSite)

    const document = await loadPage({
      requestUrl: routes.SITE_DETAILS_ACTIVITY_DESCRIPTION,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.SAME_ACTIVITY_DESCRIPTION)

    expect(
      getByText(
        document,
        'Provide details about what you plan to do at this location',
        {
          exact: false
        }
      )
    ).toBeInTheDocument()
  })
})
