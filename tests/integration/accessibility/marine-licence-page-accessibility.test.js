// @vitest-environment jsdom
import { vi } from 'vitest'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockManualCoordinatesMarineLicence,
  mockMarineLicenceApplication,
  mockMarineLicenceWithMarinePlanPolicies,
  mockSubmittedMarineLicenceApplication
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  mockMarineLicence,
  setupTestServer
} from '../shared/test-setup-helpers.js'
import { agentSession } from '../shared/session-fixtures.js'
import { selectActivityVariants } from '~/src/server/common/constants/activity-variants.js'
import { getMarinePlanPolicyLink } from '~/src/server/common/helpers/marine-licence/marine-plan-policy-link.js'
import { runPageAccessibilityTests } from './page-accessibility-tests.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/defraid-login/session-cache.js')
vi.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn()
}))

const marineLicencePages = [
  {
    url: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
    title: 'Site name'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
    title: 'Project name'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
    title: 'Project background'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
    title: 'Fee estimate'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE_ARE_YOU_SURE,
    title: 'Are you sure you do not accept the fee estimate?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
    title:
      'Does your organisation have special legal powers to do any of this project?',
    session: agentSession
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
    title:
      'Have you applied to, or got permission from, any other authorities in relation to this project?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
    title: 'Is your project located in a harbour authority area?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_IS_INVOICE_ADDRESS_UK_OR_INTERNATIONAL,
    title: "Is the invoice contact's address in the UK or international?"
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_UK_INVOICE_ADDRESS,
    title: 'UK invoice address'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
    title: 'Sharing your project information publicly'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
    title: 'Marine plan policies guidance'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
    title: 'What are your preferred start and end dates for the licence?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
    title:
      'Have you consulted with any public groups or organisations before making this application?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
    title: 'Marine licence start page',
    session: agentSession
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
    title: 'Marine plan policies',
    marineLicence: mockMarineLicenceWithMarinePlanPolicies
  },
  {
    url: getMarinePlanPolicyLink('SW-BIO-1'),
    title: 'SW-BIO-1',
    marineLicence: mockMarineLicenceWithMarinePlanPolicies
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
    title: 'Site details'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
    title: 'Water Framework Directive'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
    title:
      'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
    title:
      'Is your project limited to one of the following excluded activities?'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS,
    title: 'Check your answers for Water Framework Directive'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=1&activity=1`,
    title: 'Type of activity'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_ACTIVITY_DESCRIPTION}?site=1&activity=1`,
    title: 'Activity description'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_DURATION}?site=1&activity=1`,
    title: 'What is the maximum duration of the activity?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_MONTHS_OF_ACTIVITY}?site=1&activity=1`,
    title: 'Will the activity be limited to specific months of the year?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_COMPLETION_DATE}?site=1&activity=1`,
    title:
      'Does any part of the activity need to be completed by a certain date?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_WORKING_HOURS}?site=1&activity=1`,
    title: 'What are the proposed working hours?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_SITE}?site=1`,
    title: 'Are you sure you want to delete this site?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY}?site=1&activity=2`,
    title: 'Are you sure you want to delete this activity?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION}?site=1`,
    title: 'Change site location'
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
    url: marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT,
    title: 'Enter the coordinates at the centre point of the site'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
    title: 'Enter the width of the circular site in metres'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
    title: 'Enter multiple sets of coordinates to mark the boundary of the site'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
    title: 'Review site details'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
    title: 'Review site details',
    marineLicence: mockManualCoordinatesMarineLicence
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
    title: 'Check your answers before sending your information'
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
    title: 'Check your answers before sending your information',
    marineLicence: mockManualCoordinatesMarineLicence
  },
  {
    url: marineLicenceRoutes.MARINE_LICENCE_DELETE,
    title: 'Are you sure you want to delete this project?'
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockSubmittedMarineLicenceApplication.id}`,
    title: mockSubmittedMarineLicenceApplication.projectName,
    marineLicence: mockSubmittedMarineLicenceApplication
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${mockSubmittedMarineLicenceApplication.id}`,
    title: mockSubmittedMarineLicenceApplication.projectName,
    marineLicence: mockSubmittedMarineLicenceApplication
  },
  {
    url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=123`,
    title: 'Application sent'
  }
  // TODO: Uncomment when meta refresh a11y issue is resolved (same issue as upload-and-wait)
  // {
  //   url: marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES,
  //   title: 'Loading your Marine plan policies'
  // }
]

const dynamicPages = Object.entries(selectActivityVariants).map(
  ([key, page]) => ({
    url: `/marine-licence/activity-details/${key}?site=1&activity=1`,
    title: page.heading
  })
)

describe('Marine licence page accessibility checks (Axe)', () => {
  const getServer = setupTestServer()

  runPageAccessibilityTests({
    getServer,
    pages: marineLicencePages.concat(dynamicPages),
    setupMocks: ({ marineLicence = mockMarineLicenceApplication }) => {
      mockMarineLicence(marineLicence)
    }
  })
})
