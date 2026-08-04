import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import * as marineLicenceService from '~/src/services/marine-licence-service/index.js'

vi.mock('~/src/services/marine-licence-service/index.js')

describe('Marine Plan Policy Query Spinner', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicyJob: 'pending'
    })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue({
        ...mockMarineLicenceApplication,
        marinePlanPolicyJob: 'pending'
      })
    })
  })

  test('should render spinner page with correct heading when job is pending', async () => {
    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Loading your Marine plan policies'
    )
  })

  test('should redirect to task list when marinePlanPolicyJob is ready', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceApplication,
          marinePlanPolicyJob: 'ready'
        })
      }
    )

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should re-trigger the query and render the spinner when marinePlanPolicyJob is failed and site details are completed', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceApplication,
          marinePlanPolicyJob: 'failed'
        })
      }
    )

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Loading your Marine plan policies'
    )
  })

  test('should redirect to task list when marinePlanPolicyJob is failed and site details are not completed', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceApplication,
          marinePlanPolicyJob: 'failed',
          taskList: {
            ...mockMarineLicenceApplication.taskList,
            siteDetails: 'IN_PROGRESS'
          }
        })
      }
    )

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
