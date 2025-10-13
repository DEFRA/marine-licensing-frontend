// @vitest-environment jsdom
import { vi } from 'vitest'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { toHaveNoViolations } from 'vitest-axe/matchers'
import { runAxeChecks } from '~/.vite/axe-helper.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import {
  mockExemption as mockExemptionData,
  mockExemptionWithShapefile,
  mockProjectList
} from '~/src/server/test-helpers/mocks.js'
import { mockExemption, setupTestServer } from '../shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Page accessibility checks (Axe)', () => {
  beforeAll(() => {
    expect.extend(toHaveNoViolations)
  })
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue({
      getStatus: vi.fn().mockResolvedValue({
        status: 'pending'
      }),
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url',
        fileType: 'kml'
      })
    })
  })

  const pages = [
    { url: routes.DASHBOARD, title: 'Your projects' },
    { url: routes.TASK_LIST, title: 'Task list' },
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
    {
      url: routes.FILE_UPLOAD,
      title: 'Upload a <shapefile | KML file>',
      exemption: mockExemptionWithShapefile
    },
    // TODO: Uncomment when upload and wait a11y issue fixed (use of meta refresh)
    // {
    //   url: routes.UPLOAD_AND_WAIT,
    //   title: 'Upload and wait',
    //   exemption: mockExemptionWithUploadConfig
    // },
    {
      url: routes.COORDINATES_ENTRY_CHOICE,
      title: 'How do you want to enter the coordinates?'
    },
    {
      url: routes.COORDINATE_SYSTEM_CHOICE,
      title: 'Which coordinate system do you want to use?'
    },
    {
      url: routes.CIRCLE_CENTRE_POINT,
      title: 'Enter the coordinates at the centre point of the site'
    },
    {
      url: routes.WIDTH_OF_SITE,
      title: 'Enter the width of the circular site in metres'
    },
    {
      url: routes.ENTER_MULTIPLE_COORDINATES,
      title:
        'Enter multiple sets of coordinates to mark the boundary of the site'
    },
    {
      url: routes.REVIEW_SITE_DETAILS,
      title: 'Review site details'
    },
    { url: routes.PUBLIC_REGISTER, title: 'Public register' },
    { url: routes.CHECK_YOUR_ANSWERS, title: 'Check your answers' },
    {
      url: `${routes.CONFIRMATION}?applicationReference=123`,
      title: 'Application complete'
    },
    { url: routes.SITE_NAME, title: 'Site name' },
    {
      url: routes.SAME_ACTIVITY_DATES,
      title: 'Are the activity dates the same for every site?'
    },
    {
      url: routes.SAME_ACTIVITY_DESCRIPTION,
      title: 'Is the activity description the same for every site?'
    },
    { url: routes.DASHBOARD, title: 'Your projects' },
    { url: routes.SITE_DETAILS, title: 'Site details' },
    {
      url: routes.PRIVACY,
      title: 'Privacy notice – Get permission for marine work'
    },
    {
      url: routes.COOKIES,
      title: 'Cookies on Get permission for marine work'
    },
    {
      url: routes.DELETE_SITE,
      title: 'Are you sure you want to delete this site?'
    },
    {
      url: routes.DELETE_ALL_SITES,
      title: 'Are you sure you want to delete all site details?'
    }
  ]

  test.each(pages)(
    '"$title" page',
    async ({ url, exemption = mockExemptionData }) => {
      mockExemption(exemption)
      vi.mocked(authenticatedGetRequest).mockImplementation(
        (_request, endpoint) => ({
          payload: {
            message: 'success',
            value: endpoint === '/exemptions' ? mockProjectList : exemption
          }
        })
      )
      const response = await makeGetRequest({
        url,
        server: getServer()
      })
      expect(response.statusCode).toBe(statusCodes.ok)
      await runAxeChecks(response.result)
    }
  )
})
