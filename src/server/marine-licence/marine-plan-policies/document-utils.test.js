import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getReturnLink,
  isChangeMode,
  loadMarinePlanPolicyDocument
} from '#src/server/marine-licence/marine-plan-policies/document-utils.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')

const documentId = 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'
const document = { documentId, documentType: 'OTHER' }
const request = { params: { documentId } }

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

  test('returns the document with the licence it belongs to', async () => {
    const marineLicence = {
      marinePlanPolicySupportingDocuments: {
        documents: [{ documentId: 'other-id' }, document]
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
      marineLicence
    })
  })

  test('throws not found when there is no licence in the cache', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({})

    await expect(loadMarinePlanPolicyDocument(request)).rejects.toMatchObject({
      output: { statusCode: 404 },
      message: 'Marine licence not found'
    })
  })

  test.each([
    ['the document is not on the licence', { documents: [] }],
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
        marinePlanPolicySupportingDocuments: { documents: [document] }
      })
    ).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
  })

  test.each([
    ['no documents have been uploaded', { documents: [] }],
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
