import { vi } from 'vitest'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getByRole } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Upload and wait page (Water Framework Directive)', () => {
  const getServer = setupTestServer()
  let mockCdpService

  beforeEach(() => {
    mockCdpService = {
      getStatus: vi.fn()
    }

    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue(
      mockCdpService
    )
  })

  const loadPageWithStatus = (status) => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      waterFrameworkDirective: {
        uploadConfig: {
          uploadId: 'test-upload-id',
          statusUrl: 'test-status-url',
          fileType: 'kml'
        }
      }
    })
    mockCdpService.getStatus.mockResolvedValue({
      status,
      filename: 'test.kml'
    })

    return loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT,
      server: getServer()
    })
  }

  const fileUploadRoute =
    marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD

  const getRedirectResponse = () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [{}]
    })

    return makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT,
      server: getServer()
    })
  }

  test('should show loading spinner when status is pending', async () => {
    const document = await loadPageWithStatus('pending')

    expect(document.querySelector('.app-loading-spinner')).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Checking your file...'
      })
    ).toBeInTheDocument()
  })

  test('should show loading spinner when status is scanning', async () => {
    const document = await loadPageWithStatus('scanning')

    expect(document.querySelector('.app-loading-spinner')).toBeInTheDocument()
  })

  test('should include meta refresh tag when processing', async () => {
    const document = await loadPageWithStatus('pending')

    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]')
    expect(metaRefresh).toBeInTheDocument()
    expect(metaRefresh.getAttribute('content')).toBe('2')
  })

  test('should redirect to file upload when no upload config is present', async () => {
    const { statusCode, headers } = await getRedirectResponse()

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(fileUploadRoute)
  })
})
