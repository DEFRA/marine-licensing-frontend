import { vi } from 'vitest'
import { within } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Upload construction drawing', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue({
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com',
        maxFileSize: 10 * 1024 * 1024
      })
    })
  })

  test('displays the upload screen for the given site and drawing', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=1&drawing=1`,
      server: getServer()
    })

    within(document).getByRole('heading', {
      level: 1,
      name: 'Site 1: Upload construction drawing 1'
    })

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      '/marine-licence/review-site-details#construction-drawing-site-1-1'
    )

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toHaveAttribute(
      'accept',
      '.pdf,.bmp,.gif,.jpg,.jpeg,.png,.tif'
    )
  })
})
