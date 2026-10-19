import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { JSDOM } from 'jsdom'
import {
  getAllByRole,
  getByRole,
  getByText,
  queryAllByRole,
  queryByRole,
  queryByText
} from '@testing-library/dom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceWithResubmissionTask,
  mockResubmissionTaskId
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import {
  authenticatedPatchRequest,
  authenticatedPostRequest
} from '~/src/server/common/helpers/authenticated-requests.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')

const marineLicenceId = mockMarineLicenceWithResubmissionTask.id
const [siteNoticeTask, resubmissionTask] =
  mockMarineLicenceWithResubmissionTask.applicationTasks
const taskUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${mockResubmissionTaskId}`
const viewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`

const photo = (filename) => ({
  uploadedFile: { filename },
  s3Location: { s3Bucket: 'mmo-uploads', s3Key: filename }
})

const withLocations = (mapLocation, taskOverrides = {}) => ({
  ...mockMarineLicenceWithResubmissionTask,
  applicationTasks: [
    siteNoticeTask,
    {
      ...resubmissionTask,
      ...taskOverrides,
      data: { locations: resubmissionTask.data.locations.map(mapLocation) }
    }
  ]
})

const withAllPhotos = (taskOverrides) =>
  withLocations(
    (location) => ({
      ...location,
      closeUpPhoto: photo(`close-up-${location.locationNumber}.jpg`),
      positionPhoto: photo(`position-${location.locationNumber}.jpg`)
    }),
    taskOverrides
  )

const resubmitted = withAllPhotos({
  resolvedAt: '2026-09-20T10:00:00.000Z',
  resolvedByName: 'Sam Evans'
})

const cardHeadings = (document) =>
  getAllByRole(document, 'heading', { name: /^Location \d+ evidence$/ }).map(
    (heading) => heading.textContent.trim()
  )

const cardFor = (document, locationNumber) =>
  document.querySelector(`#site-location-${locationNumber}`)

describe('Resubmit site notice evidence page', () => {
  const getServer = setupTestServer()

  const load = () => loadPage({ requestUrl: taskUrl, server: getServer() })

  const send = () =>
    submitForm({ requestUrl: taskUrl, server: getServer(), formData: {} })

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithResubmissionTask)
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  describe('while evidence is outstanding', () => {
    test('shows the page content and a back link to view details', async () => {
      const document = await load()

      expect(
        getByRole(document, 'heading', {
          level: 1,
          name: 'Resubmit site notice evidence'
        })
      ).toBeInTheDocument()
      expect(
        getByText(document, 'MLA/2026/10264 - Test Project')
      ).toBeInTheDocument()
      expect(document.body).toHaveTextContent(
        'We could not accept the photographs you provided for one or more locations. Even if only one photograph was rejected, you need to upload both photographs again for that location.'
      )
      expect(document.body).toHaveTextContent(
        'You must complete all sections marked Incomplete before you can send your evidence.'
      )
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        viewDetailsUrl
      )
    })

    test('shows a card only for each rejected location, in order, keeping the original numbers', async () => {
      const document = await load()

      expect(cardHeadings(document)).toEqual([
        'Location 1 evidence',
        'Location 3 evidence',
        'Location 4 evidence'
      ])
      expect(queryByText(document, 'Beach car park')).not.toBeInTheDocument()
    })

    test('shows the original location name and date read-only, with the caseworker reason', async () => {
      const document = await load()
      const card = cardFor(document, 3)

      expect(card).toHaveTextContent('Location name Yacht club')
      expect(card).toHaveTextContent(
        'Date you displayed the notice 12 September 2026'
      )
      expect(card).toHaveTextContent(
        'Why we could not accept your photographs Both photos are too dark.'
      )
      expect(
        queryAllByRole(document, 'link', { name: /^Change location name/ })
      ).toHaveLength(0)
      expect(
        queryAllByRole(document, 'link', {
          name: /^Change date you displayed the notice/
        })
      ).toHaveLength(0)
    })

    test('lets the applicant add both photos for each location', async () => {
      const document = await load()

      expect(
        getByRole(document, 'link', {
          name: 'Add close-up photo of notice (Location 3 evidence)'
        })
      ).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}?location=3`
      )
      expect(
        getByRole(document, 'link', {
          name: 'Add photo evidencing notice position and location (Location 3 evidence)'
        })
      ).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}?location=3`
      )
    })

    test('offers Change once a photo has been added', async () => {
      mockMarineLicence(
        withLocations((location) => ({
          ...location,
          closeUpPhoto: photo('new.jpg')
        }))
      )

      const document = await load()

      expect(
        getByRole(document, 'link', {
          name: 'Change close-up photo of notice (Location 1 evidence)'
        })
      ).toBeInTheDocument()
      expect(cardFor(document, 1)).toHaveTextContent('new.jpg')
    })

    test('still shows a rejected location whose original evidence is missing', async () => {
      mockMarineLicence({
        ...mockMarineLicenceWithResubmissionTask,
        siteNoticeEvidence:
          mockMarineLicenceWithResubmissionTask.siteNoticeEvidence.slice(0, 3)
      })

      const document = await load()

      expect(cardFor(document, 4)).toHaveTextContent(
        'Why we could not accept your photographs'
      )
    })

    test('offers no way to add or delete a location', async () => {
      const document = await load()

      expect(
        queryByRole(document, 'button', { name: 'Add another location' })
      ).not.toBeInTheDocument()
      expect(
        queryAllByRole(document, 'link', { name: /Delete location/ })
      ).toHaveLength(0)
    })

    test('shows the caseworker reason as text rather than markup', async () => {
      mockMarineLicence(
        withLocations((location) => ({
          ...location,
          reason: '<script>alert("x")</script>'
        }))
      )

      const document = await load()

      expect(cardFor(document, 1).querySelector('script')).toBeNull()
      expect(cardFor(document, 1)).toHaveTextContent(
        '<script>alert("x")</script>'
      )
    })

    test('loading the page and going back changes nothing', async () => {
      const document = await load()

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        viewDetailsUrl
      )
      expect(authenticatedPostRequest).not.toHaveBeenCalled()
      expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    })
  })

  describe('Send evidence', () => {
    test('is hidden while any photo is missing', async () => {
      mockMarineLicence(
        withLocations((location) => ({
          ...location,
          closeUpPhoto: photo('a.jpg'),
          ...(location.locationNumber !== 4 && {
            positionPhoto: photo('b.jpg')
          })
        }))
      )

      const document = await load()

      expect(
        queryByRole(document, 'button', { name: 'Send evidence' })
      ).not.toBeInTheDocument()
    })

    test('is shown once every photo on every card is added', async () => {
      mockMarineLicence(withAllPhotos())

      const document = await load()

      expect(
        getByRole(document, 'button', { name: 'Send evidence' })
      ).toBeInTheDocument()
    })

    test('a post is refused while any photo is missing', async () => {
      const { response } = await send()

      expect(authenticatedPostRequest).not.toHaveBeenCalled()
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(taskUrl)
    })

    test('completes the task and returns to view details', async () => {
      mockMarineLicence(withAllPhotos())

      const { response } = await send()

      expect(authenticatedPostRequest).toHaveBeenCalledWith(
        expect.anything(),
        `/marine-licence/${marineLicenceId}/application-tasks/${mockResubmissionTaskId}/resolve`,
        {}
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(viewDetailsUrl)
    })

    test('a post to a completed task is refused', async () => {
      mockMarineLicence(resubmitted)

      const { response } = await send()

      expect(authenticatedPostRequest).not.toHaveBeenCalled()
      expect(response.headers.location).toBe(taskUrl)
    })
  })

  describe('once evidence has been resubmitted', () => {
    test('shows a read-only page saying when and by whom', async () => {
      mockMarineLicence(resubmitted)

      const document = await load()

      expect(
        getByText(
          document,
          'Evidence was resubmitted 20 September 2026 by Sam Evans'
        )
      ).toBeInTheDocument()
      expect(cardFor(document, 4)).toHaveTextContent('position-4.jpg')
      expect(cardFor(document, 4)).toHaveTextContent(
        'Why we could not accept your photographs'
      )
      expect(
        queryAllByRole(document, 'link', { name: /^(Add|Change) / })
      ).toHaveLength(0)
      expect(
        queryByRole(document, 'button', { name: 'Send evidence' })
      ).not.toBeInTheDocument()
      expect(document.body).not.toHaveTextContent(
        'You must complete all sections marked'
      )
    })
  })

  describe('access', () => {
    test('forbids anyone who did not submit the application', async () => {
      vi.mocked(getUserSession).mockResolvedValue({ contactId: 'someone-else' })

      const { statusCode } = await makeGetRequest({
        url: taskUrl,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.forbidden)
    })

    test('forbids anyone else from sending evidence', async () => {
      mockMarineLicence(withAllPhotos())
      vi.mocked(getUserSession).mockResolvedValue({ contactId: 'someone-else' })

      const { response } = await send()

      expect(response.statusCode).toBe(statusCodes.forbidden)
      expect(authenticatedPostRequest).not.toHaveBeenCalled()
    })

    test('shows an error page when the task cannot be read', async () => {
      mockMarineLicence({
        ...mockMarineLicenceWithResubmissionTask,
        applicationTasks: [siteNoticeTask, { ...resubmissionTask, data: {} }]
      })

      const { statusCode } = await makeGetRequest({
        url: taskUrl,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.internalServerError)
    })

    test('redirects to view details for a task the application does not have', async () => {
      const { statusCode, headers } = await makeGetRequest({
        url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${siteNoticeTask.taskId}`,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(viewDetailsUrl)
    })
  })
})

describe('Resubmit site notice evidence photo upload', () => {
  const getServer = setupTestServer()
  const closeUpUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}`
  const positionUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}`
  const waitUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT}/${marineLicenceId}/${mockResubmissionTaskId}`
  let mockCdpService

  const sessionCookie = (response) =>
    response.headers['set-cookie']
      ?.map((cookie) => cookie.split(';')[0])
      .join('; ')

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithResubmissionTask)
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
    mockCdpService = {
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url',
        uploadUrl: 'https://cdp/upload'
      }),
      getStatus: vi.fn()
    }
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue(
      mockCdpService
    )
    vi.mocked(authenticatedPatchRequest).mockResolvedValue({})
  })

  test.each([
    ['close-up', closeUpUrl, 'Close-up photo upload'],
    ['position', positionUrl, 'Position and location photo upload']
  ])(
    'the %s photo page uses the existing upload, returning to the task page',
    async (_name, pageUrl, heading) => {
      const document = await loadPage({
        requestUrl: `${pageUrl}?location=3`,
        server: getServer()
      })

      expect(getByRole(document, 'heading', { name: heading })).toBeVisible()
      expect(document.body).toHaveTextContent('Location 3')
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        `${taskUrl}#site-location-3`
      )
      expect(mockCdpService.initiate).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectUrl: `${waitUrl}?location=3`,
          allowedMimeTypes: ['image/jpeg', 'image/png']
        })
      )
    }
  )

  test.each([
    [
      'a location the caseworker did not reject',
      mockMarineLicenceWithResubmissionTask,
      2
    ],
    ['a completed task', resubmitted, 1]
  ])(
    'redirects to the task page for %s',
    async (_case, marineLicence, location) => {
      mockMarineLicence(marineLicence)

      const { statusCode, headers } = await makeGetRequest({
        url: `${closeUpUrl}?location=${location}`,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(taskUrl)
      expect(mockCdpService.initiate).not.toHaveBeenCalled()
    }
  )

  const readyStatus = {
    status: 'ready',
    filename: 'harbour-office.png',
    s3Location: {
      s3Key: 'key',
      checksumSha256: 'sum',
      detectedContentType: 'image/png'
    }
  }

  const checkStatus = async (status) => {
    const pageResponse = await makeGetRequest({
      url: `${positionUrl}?location=4`,
      server: getServer()
    })
    mockCdpService.getStatus.mockResolvedValue(status)

    return makeGetRequest({
      url: `${waitUrl}?location=4`,
      server: getServer(),
      headers: { cookie: sessionCookie(pageResponse) }
    })
  }

  test('shows the checking page while the photo is scanned', async () => {
    const response = await checkStatus({
      status: 'scanning',
      filename: 'harbour-office.png'
    })
    const { document } = new JSDOM(response.result).window

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Checking your file...'
      })
    ).toBeInTheDocument()
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
  })

  test('saves an uploaded photo against the resubmission and returns to the task page', async () => {
    const response = await checkStatus(readyStatus)

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.anything(),
      apiRoutes.UPDATE_SITE_NOTICE_RESUBMISSION,
      {
        id: marineLicenceId,
        taskId: mockResubmissionTaskId,
        locationNumber: 4,
        positionPhoto: {
          uploadedFile: { filename: 'harbour-office.png' },
          s3Location: expect.objectContaining({
            s3Key: 'key',
            checksumSha256: 'sum'
          })
        }
      }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(taskUrl)
  })

  test('returns to the task page when the task was completed while the photo was scanned', async () => {
    vi.mocked(authenticatedPatchRequest).mockRejectedValue(Boom.notFound())

    const response = await checkStatus(readyStatus)

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(taskUrl)
  })
})
