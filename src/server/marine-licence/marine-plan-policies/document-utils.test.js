import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getChangeModeRedirectUrl,
  getReturnLink,
  isChangeMode,
  loadMarinePlanPolicyDocument
} from '#src/server/marine-licence/marine-plan-policies/document-utils.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')

const documentId = 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'
const document = { documentId, documentType: 'OTHER' }
const request = { params: { documentId }, query: {} }

const mockLicence = (marineLicence) => {
  const getMarineLicenceById = vi.fn().mockResolvedValue(marineLicence)
  vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
    getMarineLicenceById
  })
  return getMarineLicenceById
}

describe('#loadMarinePlanPolicyDocument', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
      id: 'lic-1',
      projectName: 'Test project'
    })
  })

  test('returns the linked document with the licence it belongs to', async () => {
    const marineLicence = {
      marinePlanPolicySupportingDocuments: {
        linkedDocuments: [{ documentId: 'other-id' }, document],
        unlinkedDocuments: []
      }
    }
    const getMarineLicenceById = mockLicence(marineLicence)

    const result = await loadMarinePlanPolicyDocument(request)

    expect(getMarineLicenceById).toHaveBeenCalledWith('lic-1')
    expect(result).toEqual({
      id: 'lic-1',
      documentId,
      projectName: 'Test project',
      document,
      marineLicence,
      isLinked: true
    })
  })

  test('returns an unlinked document', async () => {
    mockLicence({
      marinePlanPolicySupportingDocuments: {
        linkedDocuments: [],
        unlinkedDocuments: [document]
      }
    })

    const result = await loadMarinePlanPolicyDocument(request)

    expect(result.document).toBe(document)
    expect(result.isLinked).toBe(false)
  })

  test('throws not found when there is no licence in the cache', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({})

    await expect(loadMarinePlanPolicyDocument(request)).rejects.toMatchObject({
      output: { statusCode: 404 },
      message: 'Marine licence not found'
    })
  })

  test.each([
    [
      'the document is not on the licence',
      { linkedDocuments: [], unlinkedDocuments: [] }
    ],
    ['the licence has no supporting documents', undefined]
  ])(
    'throws not found when %s',
    async (_, marinePlanPolicySupportingDocuments) => {
      mockLicence({ marinePlanPolicySupportingDocuments })

      await expect(loadMarinePlanPolicyDocument(request)).rejects.toMatchObject(
        {
          output: { statusCode: 404 },
          message: 'Marine plan policy supporting document not found'
        }
      )
    }
  )
})

describe('#getChangeModeRedirectUrl', () => {
  const path = '/some/path'

  test.each([
    [true, {}, `${path}?action=change`],
    [true, { action: 'change' }, null],
    [false, {}, null]
  ])('isLinked=%s, query %o returns %s', (isLinked, query, expected) => {
    expect(getChangeModeRedirectUrl({ path, query }, isLinked)).toBe(expected)
  })
})

describe('#isChangeMode', () => {
  test('correctly returns true', () => {
    expect(
      isChangeMode({
        query: { action: 'change' }
      })
    ).toBeTruthy()
  })

  test('correctly returns false for no url param', () => {
    expect(
      isChangeMode({
        query: { action: 'not-change' }
      })
    ).toBeFalsy()
  })

  test('correctly returns false for incorrect param', () => {
    expect(
      isChangeMode({
        query: {}
      })
    ).toBeFalsy()
  })
})

describe('#getReturnLink', () => {
  test('returns the supporting documents review page when documents have been uploaded', () => {
    expect(
      getReturnLink({
        marinePlanPolicySupportingDocuments: { linkedDocuments: [document] }
      })
    ).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
  })

  test.each([
    ['no documents have been linked', { unlinkedDocuments: [document] }],
    ['the licence has no supporting documents', undefined]
  ])(
    'returns the marine plan policies page when %s',
    (_, marinePlanPolicySupportingDocuments) => {
      expect(getReturnLink({ marinePlanPolicySupportingDocuments })).toBe(
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      )
    }
  )
})
