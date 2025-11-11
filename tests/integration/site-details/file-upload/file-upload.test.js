import { getByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { vi } from 'vitest'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('File upload', () => {
  const getServer = setupTestServer()
  let mockCdpService

  beforeEach(() => {
    mockCdpService = {
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

  test('should show shapefile guidance text after H1 heading', async () => {
    const exemptionWithShapefile = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [
        {
          fileUploadType: 'shapefile'
        }
      ]
    }

    mockExemption(exemptionWithShapefile)

    const document = await loadPage({
      requestUrl: routes.FILE_UPLOAD,
      server: getServer()
    })

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent('Upload a Shapefile')

    const zipFileText = getByText(
      document,
      /Upload a ZIP file containing all the files for your shapefile/i
    )
    expect(zipFileText).toBeInTheDocument()

    const multipleSitesText = getByText(
      document,
      /You can include more than one site/i
    )
    expect(multipleSitesText).toBeInTheDocument()

    const { Node } = document.defaultView
    const h1Position = h1.compareDocumentPosition(zipFileText)
    expect(h1Position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const h1PositionMultiple = h1.compareDocumentPosition(multipleSitesText)
    expect(h1PositionMultiple & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('should not show shapefile guidance text for KML files', async () => {
    const exemptionWithKml = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      siteDetails: [
        {
          fileUploadType: 'kml'
        }
      ]
    }

    mockExemption(exemptionWithKml)

    const document = await loadPage({
      requestUrl: routes.FILE_UPLOAD,
      server: getServer()
    })

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent('Upload a KML file')

    expect(
      document.body.textContent.includes(
        'Upload a ZIP file containing all the files for your shapefile'
      )
    ).toBe(false)

    expect(
      document.body.textContent.includes('You can include more than one site')
    ).toBe(false)
  })
})
