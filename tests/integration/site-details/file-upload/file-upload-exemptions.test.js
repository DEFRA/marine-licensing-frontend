import { vi } from 'vitest'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { sharedFileUploadTests } from './file-upload-tests.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('File upload page (exemption)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    const mockCdpService = {
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com',
        maxFileSize: 50000000
      })
    }

    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue(
      mockCdpService
    )
  })

  const loadPageWithFileType = (fileUploadType) => {
    mockExemption({
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [{ fileUploadType }]
    })

    return loadPage({ requestUrl: routes.FILE_UPLOAD, server: getServer() })
  }

  sharedFileUploadTests({ loadPageWithFileType, projectType: 'exemption' })
})
