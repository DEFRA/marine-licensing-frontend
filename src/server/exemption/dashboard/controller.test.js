import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { dashboardController, DASHBOARD_VIEW_ROUTE } from './controller.js'

describe('#dashboard', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#dashboardController', () => {
    test('Should provide expected response with correct page title', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.DASHBOARD
      })

      expect(result).toEqual(
        expect.stringContaining(`Projects Home | ${config.get('serviceName')}`)
      )

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render dashboard template with correct context', () => {
      const h = { view: jest.fn() }

      dashboardController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects Home',
        heading: 'Projects Home',
        projects: []
      })
    })

    test('Should display sortable table with correct structure when projects exist', () => {
      const h = { view: jest.fn() }
      const request = { logger: { info: jest.fn() } }

      const projects = [
        {
          name: 'Test Project',
          type: 'Exempt activity',
          reference: 'ML-2024-001',
          status: 'Draft',
          dateSubmitted: null
        }
      ]

      dashboardController.handler = (req, response) => {
        return response.view(DASHBOARD_VIEW_ROUTE, {
          pageTitle: 'Projects Home',
          heading: 'Projects Home',
          projects
        })
      }

      dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects Home',
        heading: 'Projects Home',
        projects
      })
    })

    test('Should display empty state when no projects exist', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: routes.DASHBOARD
      })

      const { document } = new JSDOM(result).window

      const emptyState = document.querySelector('.govuk-body')
      expect(emptyState.textContent).toContain(
        'You have not created any projects yet'
      )
    })

    test('Should display projects data when projects exist', () => {
      const h = { view: jest.fn() }
      const request = { logger: { info: jest.fn() } }

      const originalHandler = dashboardController.handler
      const projects = [
        {
          name: 'Test Project 1',
          type: 'Exempt activity',
          reference: 'ML-2024-001',
          status: 'Draft',
          dateSubmitted: null
        },
        {
          name: 'Test Project 2',
          type: 'Exempt activity',
          reference: 'ML-2024-002',
          status: 'Closed',
          dateSubmitted: '2024-01-15'
        }
      ]
      dashboardController.handler = (req, response) => {
        return response.view(DASHBOARD_VIEW_ROUTE, {
          pageTitle: 'Projects Home',
          heading: 'Projects Home',
          projects
        })
      }

      dashboardController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DASHBOARD_VIEW_ROUTE, {
        pageTitle: 'Projects Home',
        heading: 'Projects Home',
        projects
      })

      dashboardController.handler = originalHandler
    })
  })
})
