import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import {
  marineLicenceConsultationDetailsRoutes,
  marineLicenceRoutes,
  routes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { consulteeSession } from '~/tests/integration/shared/session-fixtures.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { vi } from 'vitest'
import { mockMarineLicenceWithConsultationApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { CONSULTATION_STATUS_CODE } from '#src/server/common/constants/marine-licence.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Consultation details', () => {
  const getServer = setupTestServer()
  const marineLicenceId = 'test-consultation-id'
  const withId = (route) => route.replace('{marineLicenceId}', marineLicenceId)

  const notificationOfApplicationUrl = withId(
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_NOTIFICATION_OF_APPLICATION
  )
  const requestForAdviceUrl = withId(
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_REQUEST_FOR_ADVICE
  )
  const consultationResponseUrl = withId(
    marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_RESPONSE
  )

  const mockConsultation = ({
    consultationType,
    consultationStatus,
    response
  }) =>
    mockMarineLicence({
      ...mockMarineLicenceWithConsultationApplication,
      consultation: {
        ...mockMarineLicenceWithConsultationApplication.consultation,
        consultationType,
        consultationStatus,
        response
      }
    })

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(consulteeSession)
  })

  describe('Parent page redirects', () => {
    test.each([
      ['APPLICATION_NOTIFICATION', notificationOfApplicationUrl],
      ['REQUEST_FOR_ADVICE', requestForAdviceUrl]
    ])('redirects %s to its page', async (consultationType, expectedUrl) => {
      mockConsultation({ consultationType })

      const response = await makeGetRequest({
        url: withId(
          marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_DETAILS
        ),
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(expectedUrl)
    })

    test('returns not found for an unknown consultation type', async () => {
      mockConsultation({ consultationType: 'UNKNOWN_TYPE' })

      const response = await makeGetRequest({
        url: withId(
          marineLicenceConsultationDetailsRoutes.MARINE_LICENCE_CONSULTATION_DETAILS
        ),
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })
  })

  describe('Notification of application page', () => {
    test('page elements', async () => {
      mockConsultation({ consultationType: 'APPLICATION_NOTIFICATION' })

      const document = await loadPage({
        requestUrl: notificationOfApplicationUrl,
        server: getServer()
      })

      expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Notification of a marine licence application'
      )
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        routes.CONSULTATIONS
      )

      const viewLink = getByRole(document, 'link', {
        name: 'View the application (opens in new tab)'
      })
      expect(viewLink).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      )
      expect(viewLink).toHaveAttribute('target', '_blank')
      expect(viewLink).toHaveAttribute('rel', 'noopener noreferrer')

      expect(
        getByRole(document, 'heading', {
          level: 2,
          name: 'If you need to respond'
        })
      ).toBeInTheDocument()
      expect(
        getByRole(document, 'link', { name: 'Respond to the notification' })
      ).toHaveAttribute('href', consultationResponseUrl)
      expect(document.querySelector('.govuk-summary-list')).toBeNull()
    })

    test('shows correct content when already responded', async () => {
      mockConsultation({
        consultationType: 'APPLICATION_NOTIFICATION',
        consultationStatus: CONSULTATION_STATUS_CODE.RESPONDED,
        response: 'Test response'
      })

      const document = await loadPage({
        requestUrl: notificationOfApplicationUrl,
        server: getServer()
      })

      expect(
        queryByRole(document, 'heading', { name: 'If you need to respond' })
      ).toBeNull()
      expect(
        queryByRole(document, 'link', { name: 'Respond to the notification' })
      ).toBeNull()

      expect(
        getByRole(document, 'heading', { name: 'Your response' })
      ).toBeInTheDocument()

      expect(getByText(document, 'Test response')).toBeInTheDocument()
    })

    test('returns not found when no consultation is returned', async () => {
      mockMarineLicence({})

      const response = await makeGetRequest({
        url: notificationOfApplicationUrl,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })

    test('returns not found when the consultation is a request for advice', async () => {
      mockConsultation({ consultationType: 'REQUEST_FOR_ADVICE' })

      const response = await makeGetRequest({
        url: notificationOfApplicationUrl,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })
  })

  describe('Request for advice page', () => {
    test('page elements', async () => {
      mockConsultation({ consultationType: 'REQUEST_FOR_ADVICE' })

      const document = await loadPage({
        requestUrl: requestForAdviceUrl,
        server: getServer()
      })

      expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Request for advice for a marine licence application'
      )
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        routes.CONSULTATIONS
      )

      const viewLink = getByRole(document, 'link', {
        name: 'View the application (opens in new tab)'
      })
      expect(viewLink).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      )
      expect(viewLink).toHaveAttribute('target', '_blank')
      expect(viewLink).toHaveAttribute('rel', 'noopener noreferrer')

      expect(
        getByRole(document, 'heading', {
          level: 2,
          name: 'Advice requested by the MMO'
        })
      ).toBeInTheDocument()
      expect(
        getByRole(document, 'button', { name: 'Respond to the request' })
      ).toHaveAttribute('href', consultationResponseUrl)
    })

    test('shows correct content when already responded', async () => {
      mockConsultation({
        consultationType: 'REQUEST_FOR_ADVICE',
        consultationStatus: CONSULTATION_STATUS_CODE.RESPONDED,
        response: 'Test response'
      })

      const document = await loadPage({
        requestUrl: requestForAdviceUrl,
        server: getServer()
      })

      expect(
        queryByRole(document, 'heading', {
          name: 'Advice requested by the MMO'
        })
      ).toBeNull()

      expect(
        queryByRole(document, 'button', { name: 'Respond to the request' })
      ).toBeNull()

      expect(
        getByRole(document, 'heading', { name: 'Your response' })
      ).toBeInTheDocument()

      expect(getByText(document, 'Test response')).toBeInTheDocument()
    })

    test('returns not found when no consultation is returned', async () => {
      mockMarineLicence({})

      const response = await makeGetRequest({
        url: requestForAdviceUrl,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })

    test('returns not found when the consultation is a notification of application', async () => {
      mockConsultation('APPLICATION_NOTIFICATION')

      const response = await makeGetRequest({
        url: requestForAdviceUrl,
        server: getServer()
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })
  })
})
