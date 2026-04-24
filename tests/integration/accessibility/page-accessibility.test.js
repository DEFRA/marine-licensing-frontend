// @vitest-environment jsdom
import { vi } from 'vitest'
import {
  marineLicenceRoutes,
  routes
} from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { toHaveNoViolations } from 'vitest-axe/matchers'
import { runAxeChecks } from '~/.vite/axe-helper.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import {
  mockExemption as mockExemptionData,
  mockExemptionSubmitted,
  mockExemptionWithShapefile,
  mockProjectList
} from '~/src/server/test-helpers/mocks/exemption.js'
import {
  mockMarineLicenceApplication,
  mockSubmittedMarineLicenceApplication
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  mockExemption,
  mockMarineLicence,
  setupTestServer
} from '../shared/test-setup-helpers.js'
import {
  agentSession,
  citizenUserSession,
  employeeSession
} from '../shared/session-fixtures.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { config } from '~/src/config/config.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { postloginUserSession } from '~/src/server/common/helpers/defraid-login/session-cache.js'
import { selectActivityVariants } from '~/src/server/common/constants/activity-variants.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/defraid-login/session-cache.js')
vi.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn()
}))

describe('Page accessibility checks (Axe)', () => {
  beforeAll(() => {
    config.set('marineLicence.enabled', true)
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
    { url: routes.DASHBOARD, title: 'Projects' },
    { url: routes.TASK_LIST, title: 'Task list' },
    { url: routes.PROJECT_NAME, title: 'Project name' },
    { url: routes.SITE_DETAILS, title: 'Site details' },
    {
      url: routes.COORDINATES_TYPE_CHOICE,
      title: 'How do you want to provide the site location?'
    },
    {
      url: routes.CHOOSE_FILE_UPLOAD_TYPE,
      title: 'Choose file type'
    },
    {
      url: routes.FILE_UPLOAD,
      title: 'Upload a file',
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
      title: 'How do you want to enter the site coordinates?'
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
    { url: routes.ACTIVITY_DATES, title: 'Activity dates' },
    { url: routes.ACTIVITY_DESCRIPTION, title: 'Activity description' },
    {
      url: routes.REVIEW_SITE_DETAILS,
      title: 'Review site details'
    },
    {
      url: routes.PUBLIC_REGISTER,
      title: 'Sharing your project information publicly'
    },
    {
      url: routes.CHECK_YOUR_ANSWERS,
      title: 'Check your answers before sending your information'
    },
    {
      url: `${routes.CONFIRMATION}?applicationReference=123`,
      title: 'Your exemption application has been submitted successfully'
    },
    {
      url: `${routes.VIEW_DETAILS}/${mockExemptionSubmitted.id}`,
      title: mockExemptionSubmitted.projectName,
      exemption: mockExemptionSubmitted
    },
    { url: routes.SITE_NAME, title: 'Site name' },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
      title: 'Site name',
      isMarineLicence: true
    },

    {
      url: routes.MULTIPLE_SITES_CHOICE,
      title: 'Do you need to tell us about more than one site?'
    },
    {
      url: routes.SAME_ACTIVITY_DATES,
      title: 'Are the activity dates the same for every site?'
    },
    {
      url: routes.SAME_ACTIVITY_DESCRIPTION,
      title: 'Is the activity description the same for every site?'
    },
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
    },
    {
      url: routes.WITHDRAW_EXEMPTION,
      title: 'Are you sure you want to withdraw this project?'
    },
    {
      url: routes.SERVICE_HOME,
      title: 'Home'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
      title: 'Project name',
      isMarineLicence: true
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
      title: 'Project background',
      isMarineLicence: true
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
      title:
        'Does your organisation have special legal powers to do any of this project?',
      isMarineLicence: true,
      session: { ...agentSession, shouldShowOrgOrUserName: false }
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
      title:
        'Have you applied to, or got permission from, any other authorities in relation to this project?',
      isMarineLicence: true
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
      title: 'Sharing your project information publicly',
      isMarineLicence: true
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      title: 'Marine licence start page',
      isMarineLicence: true,
      session: { ...agentSession, shouldShowOrgOrUserName: false }
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
      isMarineLicence: true,
      title: 'Site details'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY,
      isMarineLicence: true,
      title: 'Type of activity'
    },
    {
      url: `${marineLicenceRoutes.MARINE_LICENCE_ACTIVITY_DESCRIPTION}?site=1&activity=1`,
      isMarineLicence: true,
      title: 'Activity description'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
      title: 'How do you want to provide the site location?'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
      title: 'Choose file type'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE,
      title: 'How do you want to enter the site coordinates?'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
      title: 'Which coordinate system do you want to use?'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
      title: 'Check your answers before sending your information',
      isMarineLicence: true
    },
    {
      url: routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR,
      title: 'Who is this exempt activity notification for?'
    },
    {
      url: routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE,
      title: 'Check you are set up to apply for your organisation'
    },
    {
      url: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      title: 'Check you are set up to apply for your client'
    },
    {
      url: routes.defraIdGuidance.REGISTER_NEW_ORG,
      title: 'Create a new Defra account for your organisation'
    },
    {
      url: routes.defraIdGuidance.ADD_TO_ORG_ACCOUNT,
      title: 'You need to be added to your organisation\u2019s Defra account'
    },
    {
      url: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      title: 'You need to be added to your client\u2019s Defra account'
    },
    {
      url: marineLicenceRoutes.MARINE_LICENCE_DELETE,
      title: 'Are you sure you want to delete this project?',
      isMarineLicence: true
    },
    {
      url: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockSubmittedMarineLicenceApplication.id}`,
      title: mockSubmittedMarineLicenceApplication.projectName,
      marineLicence: mockSubmittedMarineLicenceApplication,
      isMarineLicence: true
    },
    {
      url: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockSubmittedMarineLicenceApplication.id}`,
      title: mockSubmittedMarineLicenceApplication.projectName,
      marineLicence: mockSubmittedMarineLicenceApplication,
      isMarineLicence: true
    },
    {
      url: routes.postLogin.CONFIRM_INDIVIDUAL,
      title: "Confirm you're notifying us as an individual",
      session: citizenUserSession
    },
    {
      url: routes.postLogin.CONFIRM_EMPLOYEE,
      title: 'Are you notifying us as an employee of Test Org?',
      session: { ...employeeSession, shouldShowOrgOrUserName: false }
    },
    {
      url: routes.postLogin.CONFIRM_AGENT,
      title: 'Are you notifying us as an agent or intermediary for Client Org?',
      session: { ...agentSession, shouldShowOrgOrUserName: false }
    },
    {
      url: routes.postLogin.GUIDANCE_INDIVIDUAL,
      title: 'Exempt activity notification for an individual',
      session: { ...employeeSession, shouldShowOrgOrUserName: false }
    },
    {
      url: routes.postLogin.GUIDANCE_ORG,
      title: 'Exempt activity notification for an organisation',
      session: { ...employeeSession, shouldShowOrgOrUserName: false }
    },
    {
      url: routes.DECLARATION,
      title: 'Declaration',
      session: citizenUserSession
    },
    {
      url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=123`,
      title: 'Application sent'
    },
    {
      url: `${routes.ADMIN_EXEMPTIONS}`,
      title: 'Exemptions Admin',
      auth: { credentials: { isTeamAdmin: true } }
    },
    {
      url: `${routes.ADMIN_EMP}`,
      title: 'Exemptions not sent to EMP',
      auth: { credentials: { isTeamAdmin: true } }
    },
    {
      url: `${routes.ADMIN_BACKFILL}`,
      title: 'Exemptions without Marine Plan or Coastal Operations Areas',
      auth: { credentials: { isTeamAdmin: true } }
    }
  ]

  const dynamicPages = Object.entries(selectActivityVariants).map(
    ([key, page]) => ({
      isMarineLicence: true,
      url: `/marine-licence/activity-details/${key}`,
      title: page.heading
    })
  )

  test.each(pages.concat(dynamicPages))(
    '"$title" page',
    async ({
      title,
      url,
      exemption = mockExemptionData,
      marineLicence = mockMarineLicenceApplication,
      isMarineLicence = false,
      session,
      auth
    }) => {
      if (session) {
        vi.mocked(postloginUserSession.get).mockResolvedValue('organisation')
        vi.mocked(getUserSession).mockResolvedValue(session)
      }

      if (isMarineLicence) {
        mockMarineLicence(marineLicence)
      } else {
        mockExemption(exemption)
        vi.mocked(authenticatedGetRequest).mockImplementation(
          (_request, endpoint) => ({
            payload: {
              message: 'success',
              value: endpoint === '/exemptions' ? mockProjectList : exemption
            }
          })
        )
      }
      const response = await makeGetRequest({
        url,
        server: getServer(),
        auth
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      const { document } = new JSDOM(response.result).window
      expect(document.querySelector('title')).toHaveTextContent(
        `${title} - Get permission for marine work`
      )
      await runAxeChecks(document.documentElement)
    },
    10000
  )
})
