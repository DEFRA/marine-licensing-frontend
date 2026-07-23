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

describe('Marine Plan Policies Holding Page', () => {
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

  test('should render holding page with correct heading when job is pending', async () => {
    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Marine plan policies'
    )
  })

  test('should render holding page when job is computing', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceApplication,
          marinePlanPolicyJob: 'computing'
        })
      }
    )

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING,
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Marine plan policies'
    )
  })

  test('should redirect to the marine plan policies list when job is ready', async () => {
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
      url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('should redirect to task list when job is failed', async () => {
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValueOnce(
      {
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceApplication,
          marinePlanPolicyJob: 'failed'
        })
      }
    )

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should redirect to task list when no marine licence id in cache', async () => {
    mockMarineLicence({})

    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
