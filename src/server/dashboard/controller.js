import { config } from '#src/config/config.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { dashboardFilterSchema } from '#src/server/common/validation/dashboard/schema.js'
import {
  sortProjectsByStatus,
  formatProjectsForDisplay,
  getFilterCategories,
  fetchProjects,
  getStatusOptions,
  getTypeOptions
} from '#src/server/dashboard/utils.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

export const DASHBOARD_VIEW_ROUTE = 'dashboard/index.njk'
export const DASHBOARD_RESULTS_VIEW_ROUTE =
  'dashboard/partials/fetch-response.njk'

const DASHBOARD_PAGE_TITLE = 'Projects'

export const FILTER_SEARCH_FLASH_KEY = 'dashboardFilterSearch'

const FETCH_ERROR = 'Error fetching projects'

const isClientSideFetchRequest = (request) =>
  request.headers['x-requested-with'] === 'XMLHttpRequest'

const dashboardPayloadFailAction = (request, h, error) => {
  request.logger.error({ err: error }, 'Invalid dashboard filter payload')

  if (isClientSideFetchRequest(request)) {
    return h.response().code(statusCodes.badRequest).takeover()
  }

  return h.redirect(routes.DASHBOARD).takeover()
}

const buildDashboardViewModel = async (
  request,
  projectsPayload,
  searchParams = {}
) => {
  const projects = projectsPayload.value ?? []
  const sortedProjects = sortProjectsByStatus(projects)
  const isEmployee = projectsPayload.isEmployee ?? false

  const userSession = await getUserSession(request, request.state?.userSession)
  const organisationName = userSession?.organisationName || ''

  const marineLicenceEnabled = config.get('marineLicence').enabled

  const statusOptions = getStatusOptions(
    searchParams.status,
    marineLicenceEnabled
  )
  const filterCategories = getFilterCategories(searchParams)
  const typeOptions = getTypeOptions(searchParams.type)

  return {
    projects: formatProjectsForDisplay(sortedProjects, isEmployee),
    isEmployee,
    organisationName,
    filterCategories,
    searchParams,
    statusOptions,
    typeOptions,
    marineLicenceEnabled
  }
}

export const dashboardController = {
  handler: async (request, h) => {
    try {
      const flashedResult = request.yar.flash(FILTER_SEARCH_FLASH_KEY)
      const hasFlashedResult = flashedResult && !Array.isArray(flashedResult)

      const { payload } = await fetchProjects(
        request,
        hasFlashedResult ? flashedResult : {}
      )

      const viewModel = await buildDashboardViewModel(
        request,
        payload,
        flashedResult
      )

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        ...viewModel
      })
    } catch (error) {
      request.logger.error({ err: error }, FETCH_ERROR)

      return h.view(DASHBOARD_VIEW_ROUTE, {
        pageTitle: DASHBOARD_PAGE_TITLE,
        heading: DASHBOARD_PAGE_TITLE,
        projects: [],
        isEmployee: false,
        searchParams: {}
      })
    }
  }
}

export const dashboardPostController = {
  options: {
    validate: {
      payload: dashboardFilterSchema,
      failAction: dashboardPayloadFailAction
    }
  },
  handler: async (request, h) => {
    if (isClientSideFetchRequest(request)) {
      try {
        const { payload } = await fetchProjects(request, request.payload)

        const searchParams = request.payload

        const viewModel = await buildDashboardViewModel(
          request,
          payload,
          searchParams
        )

        return h.view(DASHBOARD_RESULTS_VIEW_ROUTE, {
          heading: DASHBOARD_PAGE_TITLE,
          ...viewModel
        })
      } catch (error) {
        request.logger.error({ err: error }, FETCH_ERROR)
        return h.response().code(statusCodes.internalServerError)
      }
    }

    try {
      request.yar.flash(FILTER_SEARCH_FLASH_KEY, request.payload, true)
      await request.yar.commit(h)
    } catch (error) {
      request.logger.error({ err: error }, FETCH_ERROR)
    }

    return h.redirect(routes.DASHBOARD)
  }
}
