import { vi } from 'vitest'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { sharedUploadAndWaitTests } from './upload-and-wait-tests.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Upload and wait page (exemption)', () => {
  const getServer = setupTestServer()
  let mockCdpService

  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project',
    siteDetails: [
      {
        uploadConfig: {
          uploadId: 'test-upload-id',
          statusUrl: 'https://status.example.com',
          fileType: 'kml'
        }
      }
    ]
  }

  beforeEach(() => {
    mockCdpService = {
      getStatus: vi.fn()
    }

    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue(
      mockCdpService
    )
  })

  const loadPageWithStatus = (status) => {
    mockExemption(mockExemptionData)

    mockCdpService.getStatus.mockResolvedValue({
      status,
      filename: 'test.kml'
    })

    return loadPage({ requestUrl: routes.UPLOAD_AND_WAIT, server: getServer() })
  }

  const getRedirectResponse = () => {
    mockExemption({
      ...mockExemptionData,
      siteDetails: [{}]
    })

    return makeGetRequest({ url: routes.UPLOAD_AND_WAIT, server: getServer() })
  }

  sharedUploadAndWaitTests({
    loadPageWithStatus,
    getRedirectResponse,
    fileUploadRoute: routes.CHOOSE_FILE_UPLOAD_TYPE
  })
})
