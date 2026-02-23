import { vi } from 'vitest'
import { dashboardController, DASHBOARD_VIEW_ROUTE } from './controller.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { formatProjectsForDisplay } from './utils.js'
import { formatDate } from '#src/config/nunjucks/filters/format-date.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/config/nunjucks/filters/format-date.js')
vi.mock('~/src/server/exemption/task-list/controller.js')

describe('#dashboard', () => {
  const authenticatedGetRequestMock = vi.mocked(authenticatedGetRequest)
  const getUserSessionMock = vi.mocked(getUserSession)
  vi.mocked(formatDate).mockReturnValue('01 Jan 2024')

  beforeEach(() => {
    getUserSessionMock.mockResolvedValue({ organisationName: '' })
  })

  describe('#dashboardController', () => {
    test('Should render dashboard template with correct context', async () => {
      authenticatedGetRequestMock.mockResolvedValueOnce({
        payload: { value: [] }
      })

      const h = { view: vi.fn() }
      const request = { logger: { error: vi.fn() }, state: {} }

      await dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: [],
        isEmployee: false,
        organisationName: '',
        filterValue: 'my-projects',
        filterMyProjects: 'my-projects',
        filterAllProjects: 'all-projects'
      })
    })

    test('Should display table with correct structure when projects exist', async () => {
      const h = { view: vi.fn() }
      const request = { logger: { error: vi.fn() }, state: {} }

      const projects = [
        {
          id: 'abc123',
          projectName: 'Test Project',

          reference: 'ML-2024-001',
          status: 'Draft',
          submittedAt: null
        }
      ]

      const expectedFormattedProjects = formatProjectsForDisplay(projects)

      expect(expectedFormattedProjects).toEqual([
        {
          attributes: { 'data-is-own-project': 'true' },
          cells: [
            { text: 'Test Project' },
            { text: 'Exempt activity notification' },
            { text: '-' },
            {
              html: '<strong class="govuk-tag govuk-tag--light-blue">Draft</strong>'
            },
            {
              text: '-',
              attributes: { 'data-sort-value': 0 }
            },
            {
              html: '<a href="/exemption/task-list/abc123" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="/exemption/delete/abc123" class="govuk-link govuk-link--no-visited-state" aria-label="Delete Test Project">Delete</a>'
            }
          ]
        }
      ])

      authenticatedGetRequestMock.mockResolvedValueOnce({
        payload: { value: projects }
      })

      await dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: expectedFormattedProjects,
        isEmployee: false,
        organisationName: '',
        filterValue: 'my-projects',
        filterMyProjects: 'my-projects',
        filterAllProjects: 'all-projects'
      })
    })

    test('Should display projects data when projects exist', async () => {
      const h = { view: vi.fn() }
      const request = { logger: { error: vi.fn() }, state: {} }

      const projects = [
        {
          projectName: 'Test Project 1',

          reference: 'ML-2024-001',
          status: 'Draft',
          submittedAt: null
        },
        {
          projectName: 'Test Project 2',

          reference: 'ML-2024-002',
          status: 'Active',
          submittedAt: '2024-01-15'
        }
      ]

      const expectedFormattedProjects = formatProjectsForDisplay(projects)

      authenticatedGetRequestMock.mockResolvedValueOnce({
        payload: { value: projects }
      })

      await dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: expectedFormattedProjects,
        isEmployee: false,
        organisationName: '',
        filterValue: 'my-projects',
        filterMyProjects: 'my-projects',
        filterAllProjects: 'all-projects'
      })
    })

    test('Should handle API errors gracefully', async () => {
      const h = { view: vi.fn() }
      const request = { logger: { error: vi.fn() }, state: {} }

      authenticatedGetRequestMock.mockRejectedValueOnce(new Error('API Error'))

      await dashboardController.handler(request, h)

      expect(request.logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        'Error fetching projects'
      )

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: [],
        isEmployee: false,
        filterValue: 'my-projects',
        filterMyProjects: 'my-projects',
        filterAllProjects: 'all-projects'
      })
    })

    test('Should handle null payload value from API', async () => {
      const h = { view: vi.fn() }
      const request = { logger: { error: vi.fn() }, state: {} }

      authenticatedGetRequestMock.mockResolvedValue({
        payload: {}
      })

      await dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: [],
        isEmployee: false,
        organisationName: '',
        filterValue: 'my-projects',
        filterMyProjects: 'my-projects',
        filterAllProjects: 'all-projects'
      })
    })
  })
})
