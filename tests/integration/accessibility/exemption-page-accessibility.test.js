// @vitest-environment jsdom
import { vi } from 'vitest'
import { routes } from '~/src/server/common/constants/routes.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import {
  mockExemption as mockExemptionData,
  mockExemptionSubmitted,
  mockExemptionWithShapefile,
  mockProjectList
} from '~/src/server/test-helpers/mocks/exemption.js'
import { mockExemption, setupTestServer } from '../shared/test-setup-helpers.js'
import {
  agentSession,
  citizenUserSession,
  employeeSession
} from '../shared/session-fixtures.js'
import { runPageAccessibilityTests } from './page-accessibility-tests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/defraid-login/session-cache.js')
vi.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn()
}))

const exemptionPages = [
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
    title: 'Enter multiple sets of coordinates to mark the boundary of the site'
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
    session: agentSession
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
  },
  {
    url: `${routes.ADMIN_REPORTS}`,
    title: 'Exemptions summary report',
    auth: { credentials: { isTeamAdmin: true } }
  }
]

describe('Exemption page accessibility checks (Axe)', () => {
  const getServer = setupTestServer()

  runPageAccessibilityTests({
    getServer,
    pages: exemptionPages,
    setupMocks: ({ exemption = mockExemptionData }) => {
      mockExemption(exemption)
      vi.mocked(authenticatedGetRequest).mockImplementation(
        (_request, endpoint) => ({
          payload: {
            message: 'success',
            value:
              endpoint === '/exemptions'
                ? mockProjectList
                : endpoint === '/exemptions/summary'
                  ? {
                      coordinatesInputMethod: {
                        shapefile: 0,
                        kml: 0,
                        manualCoordinates: 0
                      },
                      coordinateSystemVolume: {
                        wgs84: { count: 0, percentage: 0 },
                        bng: { count: 0, percentage: 0 },
                        total: 0
                      },
                      byArticle: {},
                      byMarinePlanArea: {},
                      byCoastalOperationsArea: {}
                    }
                  : exemption
          }
        })
      )
    }
  })
})
