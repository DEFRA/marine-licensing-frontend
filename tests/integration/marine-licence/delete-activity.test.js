import { vi } from 'vitest'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Delete activity', () => {
  mockMarineLicence(mockMarineLicenceApplication)

  const getServer = setupTestServer()

  describe('when the application has multiple activities', () => {
    test('should display the delete activity page for non-first activities', async () => {
      const document = await loadPage({
        requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY}?site=1&activity=2`,
        server: getServer()
      })
      const pageHeading = within(document).getByRole('heading', {
        level: 1,
        name: 'Are you sure you want to delete this activity?'
      })
      expect(pageHeading).toBeInTheDocument()

      const inset = document.querySelector('.govuk-inset-text')
      expect(inset).toHaveTextContent('Site 1')

      const backLink = within(document).getByRole('link', { name: 'Back' })
      expect(backLink).toHaveAttribute(
        'href',
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )

      within(document).getByRole('button', {
        name: 'Yes, delete activity'
      })

      const cancelLink = within(document).getByRole('link', {
        name: 'Cancel'
      })
      expect(cancelLink).toHaveAttribute(
        'href',
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
    })

    test('should redirect to review site details when attempting to delete the first activity', async () => {
      const response = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY}?site=1&activity=1`,
        server: getServer()
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
    })
  })
})
