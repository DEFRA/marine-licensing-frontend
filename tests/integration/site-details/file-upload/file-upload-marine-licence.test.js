import { vi } from 'vitest'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { sharedFileUploadTests } from './file-upload-tests.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('File upload page (marine licence)', () => {
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
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [{ fileUploadType }]
    })

    return loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
      server: getServer()
    })
  }

  sharedFileUploadTests({ loadPageWithFileType })
})
