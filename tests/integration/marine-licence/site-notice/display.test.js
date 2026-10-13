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
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  mockApplicationTaskContactId,
  mockSubmittedMarineLicenceApplication,
  mockMarineLicenceWithApplicationTask
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { PUBLIC_NOTICE_REQUEST_RELATES_TO } from '~/src/server/common/constants/site-notice.js'
import {
  authenticatedGetRequest,
  authenticatedPostRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import { findSiteNoticeTask } from '~/src/server/common/helpers/marine-licence/site-notice.js'

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

    const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      expectedViewDetailsUrl
    )
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
    ).toBeInTheDocument()
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
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${licenceId}?location=1`
    )
    expect(
      getByRole(document, 'link', {
        name: 'Change photo evidencing notice position and location (Location 2 evidence)'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${licenceId}?location=2`
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
    ).toBeInTheDocument()
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
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${licenceId}?location=1`
    )

    expect(
      getByRole(document, 'link', {
        name: 'Change date you displayed the notice (Location 1 evidence)'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED}/${licenceId}?location=1`
    )

    expect(
      getByRole(document, 'link', {
        name: 'Change close-up photo of notice (Location 1 evidence)'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${licenceId}?location=1`
    )

    expect(
      getByRole(document, 'link', {
        name: 'Change photo evidencing notice position and location (Location 1 evidence)'
      })
    ).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${licenceId}?location=1`
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

  describe('Send evidence', () => {
    const marineLicenceId = mockMarineLicenceWithApplicationTask.id
    const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
    const viewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
    const incompleteMarineLicence = {
      ...mockMarineLicenceWithApplicationTask,
      siteNoticeEvidence: [{ locationName: 'Harbour wall' }]
    }

    const mockLicence = (marineLicence) =>
      vi.mocked(authenticatedGetRequest).mockResolvedValue({
        payload: { message: 'success', value: marineLicence }
      })

    test('sends evidence when all evidence is complete', async () => {
      const { taskId } = findSiteNoticeTask(
        mockMarineLicenceWithApplicationTask
      )

      const document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(document.body).toHaveTextContent(
        'Check that you have added evidence for every location where you displayed a site notice.'
      )
      expect(
        getByRole(document, 'button', { name: 'Send evidence' })
      ).toBeInTheDocument()

      const { response } = await submitForm({
        requestUrl: displayUrl,
        server: getServer(),
        formData: {}
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.anything(),
        `/marine-licence/${marineLicenceId}/application-tasks/${taskId}/resolve`,
        {}
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(viewDetailsUrl)
    })

    test('does not send evidence when evidence is incomplete', async () => {
      mockLicence(incompleteMarineLicence)

      const document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(
        queryByRole(document, 'button', { name: 'Send evidence' })
      ).not.toBeInTheDocument()

      const { response } = await submitForm({
        requestUrl: displayUrl,
        server: getServer(),
        formData: {}
      })

      expect(authenticatedPostRequest).not.toHaveBeenCalled()
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(displayUrl)
    })

    test('shows a read only page once evidence has been sent', async () => {
      const siteNoticeTask = findSiteNoticeTask(
        mockMarineLicenceWithApplicationTask
      )
      mockLicence({
        ...mockMarineLicenceWithApplicationTask,
        applicationTasks:
          mockMarineLicenceWithApplicationTask.applicationTasks.map((task) =>
            task === siteNoticeTask
              ? {
                  ...task,
                  resolvedAt: '2026-10-05T10:00:00.000Z',
                  resolvedByName: 'Sam Evans'
                }
              : task
          )
      })

      const document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(
        getByText(
          document,
          'Evidence was submitted 5 October 2026 by Sam Evans'
        )
      ).toBeInTheDocument()
      expect(
        queryByRole(document, 'button', { name: 'Send evidence' })
      ).not.toBeInTheDocument()
      expect(
        queryByRole(document, 'link', {
          name: 'Change location name (Location 1 evidence)'
        })
      ).not.toBeInTheDocument()

      const { response } = await submitForm({
        requestUrl: displayUrl,
        server: getServer(),
        formData: {}
      })

      expect(authenticatedPostRequest).not.toHaveBeenCalled()
      expect(response.headers.location).toBe(displayUrl)
    })
  })

  describe('Add another location', () => {
    const marineLicenceId = mockMarineLicenceWithApplicationTask.id
    const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
    const addEvidenceUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_ADD_EVIDENCE}/${marineLicenceId}`

    const mockLicence = (marineLicence) =>
      vi.mocked(authenticatedGetRequest).mockResolvedValue({
        payload: { message: 'success', value: marineLicence }
      })

    test('shows "Add another location" button when less than 30 locations and not submitted', async () => {
      const document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(
        getByRole(document, 'button', { name: 'Add another location' })
      ).toBeInTheDocument()
    })

    test('hides "Add another location" button when evidence is submitted or at location limit', async () => {
      mockLicence(mockSubmittedMarineLicenceApplication)

      let document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(
        queryByRole(document, 'button', { name: 'Add another location' })
      ).not.toBeInTheDocument()

      const licenceLimit = {
        ...mockMarineLicenceWithApplicationTask,
        siteNoticeEvidence: Array.from({ length: 30 }, (_, i) => ({
          locationName: `Location ${i + 1}`,
          dateDisplayed: { day: '1', month: '01', year: '2026' },
          closeUpPhoto: { uploadedFile: { filename: `photo-${i + 1}.jpg` } },
          positionPhoto: { uploadedFile: { filename: `photo-${i + 1}.jpg` } }
        }))
      }

      mockLicence(licenceLimit)

      document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(
        queryByRole(document, 'button', { name: 'Add another location' })
      ).not.toBeInTheDocument()
    })

    test('POST to add evidence redirects with anchor to new card', async () => {
      const currentLicence = {
        ...mockMarineLicenceWithApplicationTask,
        siteNoticeEvidence: [
          {
            locationName: 'Harbour wall',
            dateDisplayed: { day: '5', month: '03', year: '2026' },
            closeUpPhoto: { uploadedFile: { filename: 'close-up.jpg' } },
            positionPhoto: { uploadedFile: { filename: 'position.jpg' } }
          }
        ]
      }

      mockLicence(currentLicence)

      const { response } = await submitForm({
        requestUrl: addEvidenceUrl,
        server: getServer(),
        formData: {}
      })

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/marine-licence/add-site-notice-evidence',
        { id: marineLicenceId }
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(`${displayUrl}#site-location-2`)

      let document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      const card = document.getElementById('site-location-1')
      expect(card).toBeInTheDocument()
      expect(card.classList.contains('govuk-summary-card')).toBe(true)

      // Test incomplete cards hide Send evidence
      const incompleteLicence = {
        ...mockMarineLicenceWithApplicationTask,
        siteNoticeEvidence: [
          {
            locationName: 'Harbour wall',
            dateDisplayed: { day: '5', month: '03', year: '2026' },
            closeUpPhoto: { uploadedFile: { filename: 'close-up.jpg' } },
            positionPhoto: { uploadedFile: { filename: 'position.jpg' } }
          },
          {} // incomplete second card
        ]
      }

      mockLicence(incompleteLicence)

      document = await loadPage({
        requestUrl: displayUrl,
        server: getServer()
      })

      expect(
        queryByRole(document, 'button', { name: 'Send evidence' })
      ).not.toBeInTheDocument()
    })
  })
})
