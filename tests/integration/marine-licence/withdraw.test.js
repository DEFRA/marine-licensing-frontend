import { vi } from 'vitest'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { TERMS_AND_CONDITIONS_LINK } from '#src/server/marine-licence/withdraw/controller.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')

const marineLicenceId = '68b1b8f4c1a2b3d4e5f60001'

const submittedMarineLicence = {
  id: marineLicenceId,
  projectName: 'Groyne construction, Bournemouth seafront, Dorset',
  applicationReference: 'MLA/2025/10018',
  status: PROJECT_STATUS.SUBMITTED
}

describe('Withdraw marine licence application', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(submittedMarineLicence)
  })

  describe('confirmation page', () => {
    test('should display the withdraw confirmation page', async () => {
      const document = await loadPage({
        requestUrl: marineLicenceRoutes.MARINE_LICENCE_WITHDRAW,
        server: getServer()
      })

      const pageHeading = within(document).getByRole('heading', {
        level: 1,
        name: 'Are you sure you want to withdraw this application?'
      })
      expect(pageHeading).toBeInTheDocument()

      const inset = document.querySelector('.govuk-inset-text')
      expect(inset).toHaveTextContent(
        'Marine licence application: Groyne construction, Bournemouth seafront, Dorset'
      )

      expect(
        within(document).getByText(
          /we will not progress it any further. You must not carry out the proposed works unless a valid marine licence is in place/
        )
      ).toBeInTheDocument()

      const termsLink = within(document).getByRole('link', {
        name: 'terms and conditions (opens in new tab)'
      })
      expect(termsLink).toHaveAttribute('href', TERMS_AND_CONDITIONS_LINK)
      expect(termsLink).toHaveAttribute('target', '_blank')

      within(document).getByRole('button', {
        name: 'Yes, withdraw application'
      })

      const backLink = within(document).getByRole('link', { name: 'Back' })
      expect(backLink).toHaveAttribute('href', routes.DASHBOARD)

      const cancelLink = within(document).getByRole('link', { name: 'Cancel' })
      expect(cancelLink).toHaveAttribute('href', routes.DASHBOARD)
    })

    test('should redirect to the withdraw page when selecting an application to withdraw', async () => {
      const response = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_WITHDRAW}/${marineLicenceId}`,
        server: getServer()
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(
        marineLicenceRoutes.MARINE_LICENCE_WITHDRAW
      )
    })

    test('should withdraw the application and redirect to the dashboard', async () => {
      const response = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_WITHDRAW,
        server: getServer(),
        formData: { marineLicenceId }
      })

      expect(vi.mocked(authenticatedPostRequest)).toHaveBeenCalledWith(
        expect.anything(),
        `/marine-licence/${marineLicenceId}/withdraw`,
        {}
      )
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(routes.DASHBOARD)
    })

    test('should not call the API when the submitted id does not match the cached one', async () => {
      vi.mocked(authenticatedPostRequest).mockClear()

      const response = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_WITHDRAW,
        server: getServer(),
        formData: { marineLicenceId: '68b1b8f4c1a2b3d4e5f60002' }
      })

      expect(vi.mocked(authenticatedPostRequest)).not.toHaveBeenCalled()
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(routes.DASHBOARD)
    })
  })

  describe('when the application is not submitted', () => {
    test.each([
      PROJECT_STATUS.DRAFT,
      PROJECT_STATUS.TRANSFERRED,
      PROJECT_STATUS.WITHDRAWN
    ])('should redirect to the dashboard when status is %s', async (status) => {
      mockMarineLicence({ ...submittedMarineLicence, status })

      const response = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_WITHDRAW,
        server: getServer()
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(routes.DASHBOARD)
    })
  })
})
