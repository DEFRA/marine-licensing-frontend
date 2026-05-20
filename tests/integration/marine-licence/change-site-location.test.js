import { vi } from 'vitest'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Change site location', () => {
  mockMarineLicence(mockMarineLicenceApplication)

  const getServer = setupTestServer()

  test('should display the change site location page', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION}?site=1`,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Change site location'
    })
    expect(pageHeading).toBeInTheDocument()

    const inset = document.querySelector('.govuk-inset-text')
    expect(inset).toHaveTextContent('Site 1')
    expect(inset).toHaveTextContent(/^Site 1: test site name$/)

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )

    within(document).getByRole('button', {
      name: 'Yes, change site location'
    })

    const cancelLink = within(document).getByRole('link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  test('should display the site number if name is not available', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        { ...mockMarineLicenceApplication.siteDetails[0], siteName: undefined }
      ]
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION}?site=1`,
      server: getServer()
    })

    const inset = document.querySelector('.govuk-inset-text')
    expect(inset).toHaveTextContent(/^Site 1$/)
  })
})
