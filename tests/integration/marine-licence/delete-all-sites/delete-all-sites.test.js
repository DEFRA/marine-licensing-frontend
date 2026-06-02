import { vi } from 'vitest'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Marine licence - Delete all sites', () => {
  const getServer = setupTestServer()

  beforeEach(() =>
    mockMarineLicence({
      id: 'test-marine-licence-123',
      projectName: 'Test Project',
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          siteName: 'Test site'
        }
      ]
    })
  )

  test('should display the delete all sites page', async () => {
    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_DELETE_ALL_SITES,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Are you sure you want to delete all site details?'
    })
    expect(pageHeading).toBeInTheDocument()

    const inset = document.querySelector('.govuk-inset-text')
    expect(inset).toHaveTextContent(
      "You'll lose all the site details you've already entered."
    )

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )

    within(document).getByRole('button', {
      name: 'Yes, delete all site details'
    })

    const cancelLink = within(document).getByRole('link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })
})
