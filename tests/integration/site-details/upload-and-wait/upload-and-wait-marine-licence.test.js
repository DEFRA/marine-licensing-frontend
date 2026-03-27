import { vi } from 'vitest'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { sharedUploadAndWaitTests } from './upload-and-wait-tests.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Upload and wait page (marine licence)', () => {
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
      siteDetails: [
        {
          uploadConfig: {
            uploadId: 'test-upload-id',
            statusUrl: 'test-status-url',
            fileType: 'kml'
          }
        }
      ]
    })
    mockCdpService.getStatus.mockResolvedValue({
      status,
      filename: 'test.kml'
    })

    return loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_AND_WAIT,
      server: getServer()
    })
  }

  const getRedirectResponse = () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [{}]
    })

    return makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_UPLOAD_AND_WAIT,
      server: getServer()
    })
  }

  sharedUploadAndWaitTests({
    loadPageWithStatus,
    getRedirectResponse,
    fileUploadRoute: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
  })
})
