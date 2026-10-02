import {
  getByRole,
  getByText,
  queryByRole,
  queryByText
} from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceWithApplicationTask
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '~/src/server/common/constants/site-notice.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Site notice display page (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithApplicationTask)
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  test('should display the correct content', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { name: 'Display a site notice' })
    ).toBeInTheDocument()
    expect(
      getByText(document, 'MLA/2026/10264 - Test Project')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You must publish one or more site notices to tell people about your application. This gives people who may be affected by, or interested in, the proposed activity the chance to comment.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Notices should be placed in locations chosen to best bring the proposed application to the attention of the public and interested parties. Consider locations such as those below.'
      )
    ).toBeInTheDocument()
  })

  test('should have correct navigation links', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`,
      server: getServer()
    })

    const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      expectedViewDetailsUrl
    )
  })

  test('shows the evidence section without a location card when nothing is saved', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { name: 'Send us evidence' })
    ).toBeInTheDocument()
    expect(document.body).toHaveTextContent(
      'Add the details and photographs for each location where you displayed a site notice.'
    )
    expect(document.body).toHaveTextContent(
      'You must complete all sections marked Incomplete before you can send your evidence.'
    )
    expect(
      queryByRole(document, 'heading', { name: 'Location 1 evidence' })
    ).not.toBeInTheDocument()
  })

  test('shows saved site notice evidence and links each location', async () => {
    const marineLicence = {
      ...mockMarineLicenceWithApplicationTask,
      siteNoticeEvidence: [
        {
          locationName: 'Harbour wall',
          dateDisplayed: { day: '5', month: '03', year: '2026' },
          closeUpPhoto: { uploadedFile: { filename: 'close-up.jpg' } },
          positionPhoto: { uploadedFile: { filename: 'position.jpg' } }
        },
        {
          locationName: 'Slipway',
          dateDisplayed: { day: '12', month: '04', year: '2026' },
          closeUpPhoto: { uploadedFile: { filename: 'slipway-close-up.jpg' } },
          positionPhoto: { uploadedFile: { filename: 'slipway-position.jpg' } }
        }
      ]
    }

    vi.mocked(authenticatedGetRequest).mockResolvedValue({
      payload: { message: 'success', value: marineLicence }
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicence.id}`,
      server: getServer()
    })

    const licenceId = marineLicence.id

    expect(getByText(document, 'Harbour wall')).toBeInTheDocument()
    expect(getByText(document, '5 March 2026')).toBeInTheDocument()
    expect(getByText(document, 'close-up.jpg')).toBeInTheDocument()
    expect(getByText(document, 'position.jpg')).toBeInTheDocument()
    expect(
      getByRole(document, 'link', {
        name: 'Change location name (Location 1 evidence)'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${licenceId}?evidence=1`
    )
    expect(
      queryByRole(document, 'link', {
        name: 'Change date you displayed the notice (Location 1 evidence)'
      })
    ).not.toBeInTheDocument()
    expect(
      queryByRole(document, 'link', {
        name: 'Change close-up photo of notice (Location 1 evidence)'
      })
    ).not.toBeInTheDocument()
    expect(
      queryByRole(document, 'link', {
        name: 'Change photo evidencing notice position and location (Location 1 evidence)'
      })
    ).not.toBeInTheDocument()
  })

  test('forbids anyone who did not submit the application', async () => {
    vi.mocked(getUserSession).mockResolvedValue({ contactId: 'someone-else' })

    const { statusCode } = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('displays marine users section when requestRelatesTo is MARINE_USERS', async () => {
    const marineLicenceWithMarineUsers = {
      ...mockMarineLicenceWithApplicationTask
    }

    marineLicenceWithMarineUsers.applicationTasks[1].data.requestRelatesTo =
      PUBLIC_NOTICE_REQUEST_RELATES_TO.MARINE_USERS

    vi.mocked(authenticatedGetRequest).mockResolvedValue({
      payload: { message: 'success', value: marineLicenceWithMarineUsers }
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceWithMarineUsers.id}`,
      server: getServer()
    })

    expect(getByText(document, 'Marine users')).toBeInTheDocument()

    const marineH2 = Array.from(
      document.querySelectorAll('h2.govuk-heading-m')
    ).find((h2) => h2.textContent === 'Marine users')
    const marineUl = marineH2.nextElementSibling.nextElementSibling
    const marineListItems = marineUl.querySelectorAll('li')
    expect(marineListItems.length).toBe(5)
    expect(queryByText(document, 'Community users')).not.toBeInTheDocument()
  })

  test('displays community users section when requestRelatesTo is COMMUNITY_USERS', async () => {
    const marineLicenceWithCommunityUsers = {
      ...mockMarineLicenceWithApplicationTask
    }

    marineLicenceWithCommunityUsers.applicationTasks[1].data.requestRelatesTo =
      PUBLIC_NOTICE_REQUEST_RELATES_TO.COMMUNITY_USERS

    vi.mocked(authenticatedGetRequest).mockResolvedValue({
      payload: { message: 'success', value: marineLicenceWithCommunityUsers }
    })

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceWithCommunityUsers.id}`,
      server: getServer()
    })

    expect(getByText(document, 'Community users')).toBeInTheDocument()

    const communityH2 = Array.from(
      document.querySelectorAll('h2.govuk-heading-m')
    ).find((h2) => h2.textContent === 'Community users')
    const communityUl = communityH2.nextElementSibling.nextElementSibling
    const communityListItems = communityUl.querySelectorAll('li')
    expect(communityListItems.length).toBe(4)
    expect(queryByText(document, 'Marine users')).not.toBeInTheDocument()
  })

  test('displays multiple sites section when there is more than one site', async () => {
    const marineLicenceWithMultiSite = {
      ...mockMarineLicenceWithApplicationTask
    }

    marineLicenceWithMultiSite.siteDetails = [
      marineLicenceWithMultiSite.siteDetails[0],
      marineLicenceWithMultiSite.siteDetails[0]
    ]

    marineLicenceWithMultiSite.applicationTasks[1].data.requestRelatesTo =
      PUBLIC_NOTICE_REQUEST_RELATES_TO.COMMUNITY_USERS

    vi.mocked(authenticatedGetRequest).mockResolvedValue({
      payload: { message: 'success', value: marineLicenceWithMultiSite }
    })
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`,
      server: getServer()
    })

    expect(getByText(document, 'Multiple sites')).toBeInTheDocument()
  })
})
