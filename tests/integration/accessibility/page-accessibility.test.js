import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as sessionCacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { toHaveNoViolations } from 'jest-axe'
import { runAxeChecks } from '~/.jest/axe-helper.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

expect.extend(toHaveNoViolations)

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Page accessibility checks (Axe)', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest
      .spyOn(sessionCacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    jest
      .mocked(authenticatedGetRequest)
      .mockImplementation((_request, endpoint) => ({
        payload: {
          value:
            endpoint === '/exemptions'
              ? [
                  {
                    id: 'abc123',
                    projectName: 'Test Project',
                    type: 'Exempt activity',
                    reference: 'ML-2024-001',
                    status: 'Draft',
                    submittedAt: null
                  }
                ]
              : mockExemption
        }
      }))
  })

  const pages = [
    { url: routes.PROJECT_NAME, title: 'Project name' },
    { url: routes.ACTIVITY_DATES, title: 'Activity dates' },
    { url: routes.ACTIVITY_DESCRIPTION, title: 'Activity description' },
    {
      url: routes.COORDINATES_TYPE_CHOICE,
      title: 'How do you want to provide the site location?'
    },
    {
      url: routes.CHOOSE_FILE_UPLOAD_TYPE,
      title: 'Which type of file do you want to upload?'
    },
    { url: routes.PUBLIC_REGISTER, title: 'Public register' },
    { url: routes.CHECK_YOUR_ANSWERS, title: 'Check your answers' },
    {
      url: `${routes.CONFIRMATION}?applicationReference=123`,
      title: 'Application complete'
    },
    { url: routes.DASHBOARD, title: 'Your projects' },
    { url: routes.SITE_DETAILS, title: 'Site details' }
  ]

  test.each(pages)(
    '$title page should have no accessibility violations',
    async ({ url }) => {
      const response = await server.inject({
        method: 'GET',
        url
      })
      expect(response.statusCode).toBe(statusCodes.ok)
      await runAxeChecks(response.result)
    }
  )
})
