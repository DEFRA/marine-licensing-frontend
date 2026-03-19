import { vi } from 'vitest'
import {
  adminBackfillController,
  adminBackfillSendController,
  DASHBOARD_VIEW_ROUTE
} from './controller.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { formatProjectsForDisplay } from './utils.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/exemption/task-list/controller.js')

const createRequest = () => ({
  h: { view: vi.fn(), redirect: vi.fn() },
  request: {
    logger: { error: vi.fn() },
    plugins: { crumb: '123' },
    auth: { credentials: { isTeamAdmin: true } }
  }
})

describe('Admin dashboard to backfill Marine Plan Areas and Coastal Operations areas', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)

  describe('#adminBackfillController', () => {
    test('Should render dashboard template with correct context', async () => {
      authenticatedGetRequestMock.mockResolvedValueOnce({
        payload: { value: { backfillAreas: [] } }
      })

      const { h, request } = createRequest()

      await adminBackfillController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Exemptions without Marine Plan or Coastal Operations Areas',
        heading: 'Exemptions without Marine Plan or Coastal Operations Areas',
        projects: []
      })
    })

    test('Should display projects data when projects exist', async () => {
      const { h, request } = createRequest()

      const projects = [
        {
          _id: 'abc123',
          projectName: 'Test Project 1',
          applicationReference: 'ML-2024-001',
          status: 'Active',
          submittedAt: '2024-02-15',
          previouslyFailedAt: '2024-02-14T10:30:00.000Z'
        },
        {
          _id: 'def456',
          projectName: 'Test Project 2',

          applicationReference: 'ML-2024-002',
          status: 'Active',
          submittedAt: '2024-01-15',
          previouslyFailedAt: '2024-01-14T14:45:00.000Z'
        }
      ]

      const expectedFormattedProjects = formatProjectsForDisplay(
        projects,
        '123'
      )

      authenticatedGetRequestMock.mockResolvedValueOnce({
        payload: {
          value: { backfillAreas: projects }
        }
      })

      await adminBackfillController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Exemptions without Marine Plan or Coastal Operations Areas',
        heading: 'Exemptions without Marine Plan or Coastal Operations Areas',
        projects: expectedFormattedProjects
      })
    })

    test('Should handle API errors gracefully', async () => {
      const { h, request } = createRequest()

      authenticatedGetRequestMock.mockRejectedValueOnce(new Error('API Error'))

      await adminBackfillController.handler(request, h)

      expect(request.logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Error rendering internal admin page'
      )

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Exemptions without Marine Plan or Coastal Operations Areas',
        heading: 'Exemptions without Marine Plan or Coastal Operations Areas',
        projects: []
      })
    })

    test('Should handle null payload value from API', async () => {
      const { h, request } = createRequest()

      authenticatedGetRequestMock.mockResolvedValue({
        payload: {}
      })

      await adminBackfillController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Exemptions without Marine Plan or Coastal Operations Areas',
        heading: 'Exemptions without Marine Plan or Coastal Operations Areas',
        projects: []
      })
    })
  })

  describe('#adminBackfillSendController', () => {
    const authenticatedPostRequestMock = vi.mocked(authenticatedPostRequest)

    test('Should send exemption to back end and redirect to admin exemptions', async () => {
      const { h, request } = createRequest()
      request.payload = { exemptionId: 'test-exemption-123' }

      authenticatedPostRequestMock.mockResolvedValueOnce({})

      await adminBackfillSendController.handler(request, h)

      expect(authenticatedPostRequestMock).toHaveBeenCalledWith(
        request,
        '/exemption/backfill-areas',
        {
          id: 'test-exemption-123'
        }
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.ADMIN_BACKFILL)
    })

    test('Should handle errors and redirect to admin exemptions', async () => {
      const { h, request } = createRequest()
      request.payload = { exemptionId: 'test-exemption-456' }

      const error = new Error('Failed to send')
      authenticatedPostRequestMock.mockRejectedValueOnce(error)

      await adminBackfillSendController.handler(request, h)

      expect(request.logger.error).toHaveBeenCalledWith(
        { err: error },
        'Error when attempting backfill of Areas'
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.ADMIN_BACKFILL)
    })

    test('Should handle missing exemptionId', async () => {
      const { h, request } = createRequest()
      request.payload = {}

      authenticatedPostRequestMock.mockResolvedValueOnce({})

      await adminBackfillSendController.handler(request, h)

      expect(authenticatedPostRequestMock).toHaveBeenCalledWith(
        request,
        '/exemption/backfill-areas',
        {
          id: undefined
        }
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.ADMIN_BACKFILL)
    })
  })
})
