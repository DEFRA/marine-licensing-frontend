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

vi.mock('#src/server/common/helpers/authenticated-requests.js')

describe('Delete site', () => {
  mockMarineLicence(mockMarineLicenceApplication)

  const getServer = setupTestServer()

  test('should display the delete site page', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_SITE}?site=1`,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Are you sure you want to delete this site?'
    })
    expect(pageHeading).toBeInTheDocument()

    const inset = document.querySelector('.govuk-inset-text')
    expect(inset).toHaveTextContent('Site 1: test site name')

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )

    within(document).getByRole('button', { name: 'Yes, delete site' })

    const cancelLink = within(document).getByRole('link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  test('should redirect to task list when site param is out of range', async () => {
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_SITE}?site=99`,
      server: getServer()
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
