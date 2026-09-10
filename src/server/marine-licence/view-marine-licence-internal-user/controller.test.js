import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  viewDetailsInternalUserController,
  VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE
} from './controller.js'
import { errorMessages } from '#src/server/common/constants/error-messages.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  mockMarineLicenceApplication,
  mockRedactions,
  mockSubmittedMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'

vi.mock('#src/server/common/helpers/marine-licence/site-data.js', () => ({
  buildSiteData: vi
    .fn()
    .mockReturnValue({ coordinatesType: null, summaryData: [] })
}))

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock(
  '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
)

const createSubmittedMarineLicence = (overrides = {}) => ({
  ...mockSubmittedMarineLicenceApplication,
  ...overrides
})

const createMockRequest = (overrides = {}) => ({
  path: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockMarineLicenceApplication.id}`,
  params: { marineLicenceId: mockMarineLicenceApplication.id },
  logger: { error: vi.fn() },
  plugins: { crumb: 'test-crumb-token' },
  ...overrides
})

describe('marine-licence view details internal-user redaction controller', () => {
  let mockMarineLicenceService

  beforeEach(() => {
    mockMarineLicenceService = {
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(mockSubmittedMarineLicenceApplication)
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockMarineLicenceService)
  })

  test('should call view with correct page header', async () => {
    const marineLicence = createSubmittedMarineLicence()
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await viewDetailsInternalUserController.handler(mockRequest, mockH)

    expect(getMarineLicenceService).toHaveBeenCalledWith(expect.any(Object))
    expect(mockServiceInstance.getMarineLicenceById).toHaveBeenCalledWith(
      mockMarineLicenceApplication.id
    )

    expect(mockH.view).toHaveBeenCalledWith(
      VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE,
      expect.objectContaining({
        pageTitle: 'Redact application for the public register',
        pageCaption: `${marineLicence.applicationReference} - ${marineLicence.projectName}`,
        backLink: null
      })
    )
  })

  test('passes redaction data for preferred dates to the view', async () => {
    const marineLicence = createSubmittedMarineLicence()
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await viewDetailsInternalUserController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE,
      expect.objectContaining({
        preferredDates: 'July 2026 to August 2027',
        redactionSaveUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockMarineLicenceApplication.id}/redact`,
        csrfToken: 'test-crumb-token'
      })
    )
  })

  test('passes redactions through to the view', async () => {
    const marineLicence = createSubmittedMarineLicence({
      redactions: mockRedactions
    })
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await viewDetailsInternalUserController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE,
      expect.objectContaining({
        preferredDates: 'July 2026 to August 2027',
        redactions: {
          preferredDates: {
            ...mockRedactions.preferredDates,
            redactedTextValue: mockRedactions.preferredDates.redactedText
          }
        }
      })
    )
  })

  test('passes marine plan policies data to the view', async () => {
    const mockPolicies = [
      {
        policyCode: 'S-CC-1',
        wording: 'Wording',
        response: 'Consideration',
        changeHref: '/marine-licence/marine-plan-policy/S-CC-1'
      }
    ]
    vi.mocked(buildMarinePlanPoliciesData).mockReturnValue(mockPolicies)

    const marineLicence = createSubmittedMarineLicence()
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await viewDetailsInternalUserController.handler(mockRequest, mockH)

    expect(buildMarinePlanPoliciesData).toHaveBeenCalledWith(marineLicence)
    expect(mockH.view).toHaveBeenCalledWith(
      VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE,
      expect.objectContaining({ marinePlanPolicies: mockPolicies })
    )
  })

  test('should log and throw 403 when marine licence is in Draft status', async () => {
    const draftMarineLicence = createSubmittedMarineLicence({
      status: 'Draft'
    })
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockResolvedValue(draftMarineLicence)
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await expect(
      viewDetailsInternalUserController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 403 } })

    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockMarineLicenceApplication.id,
        status: 'Draft'
      }),
      errorMessages.MARINE_LICENCE_NOT_SUBMITTED
    )
  })

  test('should log and throw 500 for unexpected errors', async () => {
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockRejectedValue(new Error('Unexpected'))
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await expect(
      viewDetailsInternalUserController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 500 } })

    expect(mockRequest.logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Error displaying marine licence details'
    )
  })

  test('propagates Boom errors from the service unchanged', async () => {
    const mockServiceInstance = {
      getMarineLicenceById: vi
        .fn()
        .mockRejectedValue(Boom.notFound('Not found'))
    }

    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await expect(
      viewDetailsInternalUserController.handler(mockRequest, mockH)
    ).rejects.toMatchObject({ isBoom: true, output: { statusCode: 404 } })
  })

  test('does not compute buildSiteData/site data outside of expected shape', async () => {
    vi.mocked(buildSiteData).mockReturnValue({
      coordinatesType: 'coordinates',
      summaryData: [{ siteNumber: 1, siteName: 'Test Site' }]
    })

    const marineLicence = createSubmittedMarineLicence()
    const mockServiceInstance = {
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    }
    vi.mocked(getMarineLicenceService).mockReturnValue(mockServiceInstance)

    const mockH = { view: vi.fn() }
    const mockRequest = createMockRequest()

    await viewDetailsInternalUserController.handler(mockRequest, mockH)

    expect(buildSiteData).toHaveBeenCalledWith(marineLicence)
    expect(mockH.view).toHaveBeenCalledWith(
      VIEW_DETAILS_INTERNAL_USER_VIEW_ROUTE,
      expect.objectContaining({
        coordinatesType: 'coordinates',
        summaryData: [{ siteNumber: 1, siteName: 'Test Site' }]
      })
    )
  })
})
