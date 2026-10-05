import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceWithApplicationTask
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  PHOTO_FILE_SIZE_ERROR_MESSAGE,
  PHOTO_FILE_TYPE_ERROR_MESSAGE
} from '~/src/server/marine-licence/site-notice/utils.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Site notice photo upload and wait page', () => {
  const getServer = setupTestServer()
  const marineLicenceId = mockMarineLicenceWithApplicationTask.id
  const closeUpPhotoUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${marineLicenceId}?evidence=1`
  const positionPhotoUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${marineLicenceId}?evidence=1`
  const waitUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PHOTO_UPLOAD_AND_WAIT}/${marineLicenceId}?evidence=1`
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
  let mockCdpService

  const sessionCookie = (response, previous) =>
    response.headers['set-cookie']
      ?.map((cookie) => cookie.split(';')[0])
      .join('; ') ?? previous

  const startUpload = async (pageUrl) => {
    const response = await makeGetRequest({
      url: pageUrl,
      server: getServer()
    })
    return sessionCookie(response)
  }

  const checkStatus = async (status, pageUrl = closeUpPhotoUrl) => {
    const cookie = await startUpload(pageUrl)
    mockCdpService.getStatus.mockResolvedValue(status)

    const response = await makeGetRequest({
      url: waitUrl,
      server: getServer(),
      headers: { cookie }
    })
    return { response, cookie: sessionCookie(response, cookie) }
  }

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithApplicationTask)
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
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  test('should show loading spinner while the photo is uploading', async () => {
    const { response } = await checkStatus({
      status: 'scanning',
      filename: 'notice.jpg'
    })
    const { document } = new JSDOM(response.result).window

    expect(document.querySelector('.app-loading-spinner')).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Checking your file...'
      })
    ).toBeInTheDocument()
  })

  test.each([
    ['close-up', closeUpPhotoUrl, 'closeUpPhoto'],
    ['position', positionPhotoUrl, 'positionPhoto']
  ])(
    'should save a %s photo and return to the site notice page',
    async (_, pageUrl, field) => {
      const { response } = await checkStatus(
        {
          status: 'ready',
          filename: 'notice.jpg',
          s3Location: {
            s3Key: 'key',
            checksumSha256: 'sum',
            detectedContentType: 'image/jpeg'
          }
        },
        pageUrl
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        expect.anything(),
        apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
        expect.objectContaining({
          [field]: expect.objectContaining({
            uploadedFile: { filename: 'notice.jpg' }
          }),
          evidenceIndex: 0
        })
      )
      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(displayUrl)
    }
  )

  test.each([
    [
      'a file that is not a JPG or PNG',
      {
        status: 'ready',
        filename: 'notice.pdf',
        s3Location: { detectedContentType: 'application/pdf' }
      },
      PHOTO_FILE_TYPE_ERROR_MESSAGE
    ],
    [
      'a file larger than 10MB',
      { status: 'rejected', errorCode: 'FILE_TOO_LARGE' },
      PHOTO_FILE_SIZE_ERROR_MESSAGE
    ]
  ])(
    'should return to the upload page with an error for %s',
    async (_, status, message) => {
      const { response, cookie } = await checkStatus(status)

      expect(response.statusCode).toBe(statusCodes.redirect)
      expect(response.headers.location).toBe(closeUpPhotoUrl)

      const uploadPage = await makeGetRequest({
        url: closeUpPhotoUrl,
        server: getServer(),
        headers: { cookie }
      })
      const { document } = new JSDOM(uploadPage.result).window

      expect(getByRole(document, 'link', { name: message })).toBeInTheDocument()
    }
  )

  test('should redirect to the site notice page when there is no upload session', async () => {
    const { statusCode, headers } = await makeGetRequest({
      url: waitUrl,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(displayUrl)
  })
})
