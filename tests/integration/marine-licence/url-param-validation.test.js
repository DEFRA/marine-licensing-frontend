import { vi } from 'vitest'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Param validation', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceApplication)
  })

  const pagesWithSiteAndActivityParams = [
    { url: marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY },
    { url: marineLicenceRoutes.MARINE_LICENCE_DURATION },
    { url: marineLicenceRoutes.MARINE_LICENCE_MONTHS_OF_ACTIVITY },
    { url: marineLicenceRoutes.MARINE_LICENCE_COMPLETION_DATE },
    { url: marineLicenceRoutes.MARINE_LICENCE_WORKING_HOURS },
    { url: marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY }
  ]

  const pagesWithSiteParamOnly = []

  const expectsTaskListRedirect = async (requestUrl) => {
    const response = await makeGetRequest({
      server: getServer(),
      url: requestUrl
    })
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  }

  const activityScenarios = (url) => {
    test('redirects when activity param is missing', async () => {
      await expectsTaskListRedirect(`${url}?site=1`)
    })
    test('redirects when activity param is not valid', async () => {
      await expectsTaskListRedirect(`${url}?activity=999`)
    })
  }

  const siteScenarios = (url) => {
    test('redirects when site param is missing', async () => {
      await expectsTaskListRedirect(`${url}?activity=1`)
    })
    test('redirects when site param is not valid', async () => {
      await expectsTaskListRedirect(`${url}?site=999&activity=1`)
    })
  }

  const siteOnlyScenarios = (url) => {
    test('redirects when site param is missing', async () => {
      await expectsTaskListRedirect(url)
    })
    test('redirects when site param is not valid', async () => {
      await expectsTaskListRedirect(`${url}?site=999`)
    })
  }

  describe.each(pagesWithSiteAndActivityParams)(
    'site and activity params - $url',
    ({ url }) => {
      activityScenarios(url)
      siteScenarios(url)
    }
  )

  describe.each(pagesWithSiteParamOnly)('site param only - $url', ({ url }) =>
    siteOnlyScenarios(url)
  )
})
