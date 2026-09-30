import {
  getByRole,
  getByText,
  getAllByRole,
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
