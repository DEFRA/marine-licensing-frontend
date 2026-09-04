import { vi } from 'vitest'
import {
  dashboardController,
  dashboardPostController,
  DASHBOARD_VIEW_ROUTE,
  DASHBOARD_RESULTS_VIEW_ROUTE,
  FILTER_SEARCH_FLASH_KEY
} from './controller.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { formatProjectsForDisplay } from '#src/server/dashboard/utils.js'
import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/config/nunjucks/filters/format-date.js')
vi.mock('~/src/server/exemption/task-list/controller.js')

// Real @hapi/yar returns [] (not undefined) when a flash key was never set
// or has already been consumed - see node_modules/@hapi/yar/lib/index.js.
const createYarMock = (flashValue = []) => ({
  flash: vi.fn().mockReturnValue(flashValue),
  commit: vi.fn().mockResolvedValue(undefined)
})

describe('#dashboard', () => {
  const authenticatedPostRequestMock = vi.mocked(authenticatedPostRequest)
  const getUserSessionMock = vi.mocked(getUserSession)
  vi.mocked(formatDate).mockReturnValue('01 Jan 2024')

  beforeEach(() => {
    getUserSessionMock.mockResolvedValue({ organisationName: '' })
  })

  describe('#dashboardController', () => {
    test('Should fetch unfiltered and render dashboard template when there is no flashed search', async () => {
      authenticatedPostRequestMock.mockResolvedValueOnce({
        payload: { value: [] }
      })

      const h = { view: vi.fn() }
      const request = {
        logger: { error: vi.fn() },
        state: {},
        yar: createYarMock()
      }

      await dashboardController.handler(request, h)

      expect(authenticatedPostRequestMock).toHaveBeenCalledWith(
        request,
        '/projects',
        {}
      )
      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: [],
        isEmployee: false,
        organisationName: '',
        filterCategories: expect.any(Object),
        searchParams: [],
        statusOptions: expect.any(Array),
        typeOptions: expect.any(Array),
        marineLicenceEnabled: expect.any(Boolean)
      })
    })

    test('Should fetch with the stored search searchParams when present', async () => {
      const flashedsearchParams = { show: 'my-projects' }

      authenticatedPostRequestMock.mockResolvedValueOnce({
        payload: { value: [], isEmployee: true }
      })

      const h = { view: vi.fn() }
      const request = {
        logger: { error: vi.fn() },
        state: {},
        yar: createYarMock(flashedsearchParams)
      }

      await dashboardController.handler(request, h)

      expect(request.yar.flash).toHaveBeenCalledWith(FILTER_SEARCH_FLASH_KEY)
      expect(authenticatedPostRequestMock).toHaveBeenCalledWith(
        request,
        '/projects',
        flashedsearchParams
      )
      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: [],
        isEmployee: true,
        organisationName: '',
        filterCategories: expect.any(Object),
        searchParams: flashedsearchParams,
        statusOptions: expect.any(Array),
        typeOptions: expect.any(Array),
        marineLicenceEnabled: expect.any(Boolean)
      })
    })

    test('Should display table with correct structure when projects exist', async () => {
      const h = { view: vi.fn() }
      const request = {
        logger: { error: vi.fn() },
        state: {},
        yar: createYarMock()
      }

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
          cells: [
            { text: 'Test Project' },
            { text: 'Exempt activity notification' },
            { text: '-' },
            {
              html: '<strong class="govuk-tag govuk-tag--blue">Draft</strong>',
              attributes: { 'data-sort-value': 'Draft' }
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

      authenticatedPostRequestMock.mockResolvedValueOnce({
        payload: { value: projects }
      })

      await dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: expectedFormattedProjects,
        isEmployee: false,
        organisationName: '',
        filterCategories: expect.any(Object),
        searchParams: [],
        statusOptions: expect.any(Array),
        typeOptions: expect.any(Array),
        marineLicenceEnabled: expect.any(Boolean)
      })
    })

    test('Should handle API errors gracefully', async () => {
      const h = { view: vi.fn() }
      const request = {
        logger: { error: vi.fn() },
        state: {},
        yar: createYarMock()
      }

      authenticatedPostRequestMock.mockRejectedValueOnce(new Error('API Error'))

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
        searchParams: {}
      })
    })

    test('Should handle null payload value from API', async () => {
      const h = { view: vi.fn() }
      const request = {
        logger: { error: vi.fn() },
        state: {},
        yar: createYarMock()
      }

      authenticatedPostRequestMock.mockResolvedValue({
        payload: {}
      })

      await dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects',
        heading: 'Projects',
        projects: [],
        isEmployee: false,
        organisationName: '',
        filterCategories: expect.any(Object),
        searchParams: [],
        statusOptions: expect.any(Array),
        typeOptions: expect.any(Array),
        marineLicenceEnabled: expect.any(Boolean)
      })
    })
  })

  describe('#dashboardPostController', () => {
    describe('no javascript fallback', () => {
      test('Should flash the submitted searchParams and redirect to the dashboard', async () => {
        const h = { redirect: vi.fn() }
        const yar = createYarMock()
        const request = {
          logger: { error: vi.fn() },
          state: {},
          headers: {},
          payload: { show: 'my-projects' },
          yar
        }

        await dashboardPostController.handler(request, h)

        expect(authenticatedPostRequestMock).not.toHaveBeenCalled()
        expect(yar.flash).toHaveBeenCalledWith(
          FILTER_SEARCH_FLASH_KEY,
          request.payload,
          true
        )
        expect(yar.commit).toHaveBeenCalledWith(h)
        expect(h.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      })

      test('Should log the error and still redirect when there is an error', async () => {
        const h = { redirect: vi.fn() }
        const yar = {
          flash: vi.fn(() => {
            throw new Error('yar error')
          }),
          commit: vi.fn().mockResolvedValue(undefined)
        }
        const request = {
          logger: { error: vi.fn() },
          state: {},
          headers: {},
          payload: { show: 'my-projects' },
          yar
        }

        await dashboardPostController.handler(request, h)

        expect(request.logger.error).toHaveBeenCalledWith(
          { err: expect.any(Error) },
          'Error fetching projects'
        )
        expect(h.redirect).toHaveBeenCalledWith(routes.DASHBOARD)
      })
    })

    describe('client side request)', () => {
      test('Should fetch with the submitted payload and render the results partial', async () => {
        const projects = [
          {
            projectName: 'Test Project',
            reference: 'ML-2024-001',
            status: 'Draft',
            submittedAt: null
          }
        ]

        authenticatedPostRequestMock.mockResolvedValueOnce({
          payload: { value: projects, isEmployee: true }
        })

        const h = { view: vi.fn() }
        const request = {
          logger: { error: vi.fn() },
          state: {},
          headers: { 'x-requested-with': 'XMLHttpRequest' },
          payload: { show: 'my-projects' },
          yar: createYarMock()
        }

        await dashboardPostController.handler(request, h)

        expect(authenticatedPostRequestMock).toHaveBeenCalledWith(
          request,
          '/projects',
          request.payload
        )
        expect(request.yar.flash).not.toHaveBeenCalled()
        expect(h.view).toHaveBeenCalledWith(DASHBOARD_RESULTS_VIEW_ROUTE, {
          heading: 'Projects',
          projects: formatProjectsForDisplay(projects, true),
          isEmployee: true,
          organisationName: '',
          filterCategories: expect.any(Object),
          searchParams: request.payload,
          statusOptions: expect.any(Array),
          typeOptions: expect.any(Array),
          marineLicenceEnabled: expect.any(Boolean)
        })
      })

      test('Should log the error and return a 500 when the backend call fails', async () => {
        authenticatedPostRequestMock.mockRejectedValueOnce(
          new Error('API Error')
        )

        const code = vi.fn()
        const h = { response: vi.fn(() => ({ code })) }
        const request = {
          logger: { error: vi.fn() },
          state: {},
          headers: { 'x-requested-with': 'XMLHttpRequest' },
          payload: { show: 'my-projects' },
          yar: createYarMock()
        }

        await dashboardPostController.handler(request, h)

        expect(request.logger.error).toHaveBeenCalledWith(
          { err: expect.any(Error) },
          'Error fetching projects'
        )
        expect(h.response).toHaveBeenCalledWith()
        expect(code).toHaveBeenCalledWith(500)
      })
    })
  })
})
