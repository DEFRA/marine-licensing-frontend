import { vi } from 'vitest'
import { within } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import {
  mockMarineLicenceApplication,
  mockMarinePlanPolicyDocument,
  mockMarinePlanPolicySupportingDocuments
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Marine plan policy supporting document upload page', () => {
  const getServer = setupTestServer()

  const loadUploadPage = async (documents) => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicySupportingDocuments: {
        ...mockMarinePlanPolicySupportingDocuments,
        linkedDocuments: documents
      }
    })
    return loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
      server: getServer()
    })
  }

  const expectReturnLinks = (document, href) => {
    expect(
      within(document).getByRole('link', { name: 'Back' })
    ).toHaveAttribute('href', href)
    expect(
      within(document).getByRole('link', { name: 'Cancel' })
    ).toHaveAttribute('href', href)
  }

  beforeEach(() => {
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue({
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com'
      })
    })
  })

  test('back and cancel go to the marine plan policies page when no documents have been uploaded', async () => {
    const document = await loadUploadPage([])

    expectReturnLinks(
      document,
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('back and cancel go to the supporting documents review page when documents have been uploaded', async () => {
    const document = await loadUploadPage([mockMarinePlanPolicyDocument])

    expectReturnLinks(
      document,
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
  })
})
