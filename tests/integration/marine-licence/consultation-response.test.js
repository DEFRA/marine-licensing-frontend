import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceConsultationDetailsRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { consulteeSession } from '~/tests/integration/shared/session-fixtures.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { expectInputError } from '~/tests/integration/shared/expect-utils.js'
import { vi } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceWithConsultationApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Consultation response', () => {
  const getServer = setupTestServer()
  const marineLicenceId = 'test-consultation-id'
  const withId = (route) => route.replace('{marineLicenceId}', marineLicenceId)

  const consultationResponseUrl = withId(
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_RESPONSE
  )
  const consultationDetailsUrl = withId(
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_DETAILS
  )
  const textareaLabel = 'Test Marine Project Your response'

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(consulteeSession)
    mockMarineLicence(mockMarineLicenceWithConsultationApplication)
  })

  test('page elements', async () => {
    const document = await loadPage({
      requestUrl: consultationResponseUrl,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your response'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      consultationDetailsUrl
    )

    const textarea = getByRole(document, 'textbox', { name: textareaLabel })
    expect(textarea).toHaveValue('')
    expect(textarea).toHaveAttribute('rows', '10')

    getByRole(document, 'button', { name: 'Send response' })
  })

  test('returns not found when no consultation is returned', async () => {
    mockMarineLicence({})

    const response = await makeGetRequest({
      url: consultationResponseUrl,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
  })

  test('redirects to consultation details after successful submission', async () => {
    const response = await makePostRequest({
      url: consultationResponseUrl,
      server: getServer(),
      formData: { consultationResponse: 'No objections' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.CONSULTATIONS)
  })

  describe('when the consultation has already been responded to', () => {
    beforeEach(() => {
      mockMarineLicence({
        consultation: {
          id: marineLicenceId,
          projectName: 'Test Marine Project',
          consultationType: 'REQUEST_FOR_ADVICE',
          consultationStatus: 'RESPONDED'
        }
      })
    })

    test('redirects to the consultations dashboard on page load', async () => {
      const response = await makeGetRequest({
        url: consultationResponseUrl,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(routes.CONSULTATIONS)
    })

    test('redirects to the consultations dashboard on submission', async () => {
      const response = await makePostRequest({
        url: consultationResponseUrl,
        server: getServer(),
        formData: { consultationResponse: 'No objections' }
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(routes.CONSULTATIONS)
    })
  })

  test('shows a validation error when submitted empty', async () => {
    const { document } = await submitForm({
      requestUrl: consultationResponseUrl,
      server: getServer(),
      formData: { consultationResponse: '' }
    })

    expectInputError({
      document,
      inputLabel: textareaLabel,
      errorMessage: 'Enter your response to the consultation'
    })
  })

  test('shows a validation error and keeps the value when over 1000 characters', async () => {
    const tooLong = 'a'.repeat(1001)

    const { document } = await submitForm({
      requestUrl: consultationResponseUrl,
      server: getServer(),
      formData: { consultationResponse: tooLong }
    })

    expectInputError({
      document,
      inputLabel: textareaLabel,
      errorMessage:
        'Your response to the consultation must be 1000 characters or fewer'
    })
    expect(getByRole(document, 'textbox', { name: textareaLabel })).toHaveValue(
      tooLong
    )
  })
})
