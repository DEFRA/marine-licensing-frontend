import {
  getByLabelText,
  getByRole,
  getByText,
  queryByRole,
  queryByText
} from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makePostRequest } from '~/src/server/test-helpers/server-requests.js'
import { exemptionNoActivityDescription } from '~/tests/integration/activity-description/fixtures.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'

vi.mock('#src/server/common/helpers/exemptions/save-site-details.js')

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
      name: 'Continue'
    })

    const input = getByLabelText(document, `Activity description`, {
      exact: false
    })
    expect(input).toHaveValue('')

    expect(
      getByText(document, exemptionNoActivityDescription.projectName, {
        exact: false
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'link', {
        name: 'Back'
      })
    ).toHaveAttribute('href', routes.ACTIVITY_DATES)

    expect(
      queryByRole(document, 'link', {
        name: 'Cancel'
      })
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        `For example, 'Collect a 0.1 cubic metre seabed sample by day grab from a workboat for particle size analysis'.`
      )
    ).toBeInTheDocument()
  })

  test('should have correct page content for single site journey', async () => {
    const mockExemptionSingleSite = {
      ...mockExemption,
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: false
      }
    }

    mockExemption(mockExemptionSingleSite)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DESCRIPTION,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.ACTIVITY_DATES)

    expect(queryByText(document, 'Site 1')).not.toBeInTheDocument()

    expect(
      getByText(
        document,
        `For example, 'Collect a 0.1 cubic metre seabed sample by day grab from a workboat for particle size analysis'.`
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        `Briefly describe what you'll do, how you'll do it, and why.`
      )
    ).toBeInTheDocument()
  })

  test('should have correct page content for multiple site journey with all sites the same', async () => {
    const mockExemptionMultipleSite = {
      ...mockExemption,
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDescription: 'yes'
      }
    }

    mockExemption(mockExemptionMultipleSite)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DESCRIPTION,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.SAME_ACTIVITY_DESCRIPTION)

    expect(queryByText(document, 'Site 1')).not.toBeInTheDocument()

    expect(
      getByText(
        document,
        `For example, 'Collect a 0.1 cubic metre seabed sample by day grab from a workboat for particle size analysis'.`
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        `Briefly describe what you'll do at all sites, how you'll do it, and why.`
      )
    ).toBeInTheDocument()
  })

  test('should have correct page content for multiple site journey with variable answers', async () => {
    const mockExemptionMultipleSite = {
      ...mockExemption,
      siteDetails: {},
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDescription: 'no'
      }
    }

    mockExemption(mockExemptionMultipleSite)

    const document = await loadPage({
      requestUrl: routes.ACTIVITY_DESCRIPTION,
      server: getServer()
    })

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.SAME_ACTIVITY_DESCRIPTION)

    expect(getByText(document, 'Site 1')).toBeInTheDocument()

    expect(
      getByText(
        document,
        `For example, 'Collect a 0.1 cubic metre seabed sample by day grab from a workboat for particle size analysis'.`
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        `Briefly describe what you'll do at this site, how you'll do it, and why.`
      )
    ).toBeInTheDocument()
  })

  test('should display Save and continue button when action parameter is present', async () => {
    const document = await loadPage({
      requestUrl: `${routes.ACTIVITY_DESCRIPTION}?action=add`,
      server: getServer()
    })

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  test('should redirect to correct page after submit when action parameter is present', async () => {
    const { updateExemptionSiteDetails } = mockExemption(mockExemption)

    const response = await makePostRequest({
      url: `${routes.ACTIVITY_DESCRIPTION}?action=add`,
      server: getServer(),
      formData: {
        activityDescription: 'Test activity description for site'
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
      'activityDescription',
      'Test activity description for site'
    )

    expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
  })

  test('should redirect to correct page after submit when action parameter is present for specific site', async () => {
    const { updateExemptionSiteDetails } = mockExemption({
      ...mockExemption,
      multipleSiteDetails: { sameActivityDescription: 'yes' },
      siteDetails: [{}, {}]
    })

    const response = await makePostRequest({
      url: `${routes.ACTIVITY_DESCRIPTION}?site=2&action=change`,
      server: getServer(),
      formData: {
        activityDescription: 'Updated activity description for site 2'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/review-site-details')

    expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      1,
      'activityDescription',
      'Updated activity description for site 2'
    )
    expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
  })
})
