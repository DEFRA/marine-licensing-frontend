import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { marinePlanPolicyDocumentsReviewController } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-documents-review/controller.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { mockLinkedMarinePlanPolicyDocument } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')

describe('#marinePlanPolicyDocumentsReviewController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({ id: 'lic-1' })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue({})
    })
  })

  test('throws not found when there is no marine licence in the session', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({})

    await expect(
      marinePlanPolicyDocumentsReviewController.handler({}, { view: vi.fn() })
    ).rejects.toThrow('Marine licence not found')
  })

  test('redirects to the marine plan policies page when there are no documents', async () => {
    const h = { redirect: vi.fn(), view: vi.fn() }

    await marinePlanPolicyDocumentsReviewController.handler({}, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
    expect(h.view).not.toHaveBeenCalled()
  })

  describe('when there are no documents left', () => {
    const CYA = marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS

    const redirectFor = async ({ returnTo, documentsOutstanding }) => {
      vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          marinePlanPolicySupportingDocuments: {
            linkedDocuments: [],
            documentsOutstanding
          }
        })
      })
      const h = { redirect: vi.fn(), view: vi.fn() }
      await marinePlanPolicyDocumentsReviewController.handler(
        { yar: { get: vi.fn().mockReturnValue(returnTo) } },
        h
      )
      return h.redirect.mock.calls[0][0]
    }

    test('returns to check your answers when nothing is outstanding', async () => {
      expect(
        await redirectFor({ returnTo: CYA, documentsOutstanding: [] })
      ).toBe(CYA)
    })

    test('goes to the marine plan policies page when documents are outstanding', async () => {
      expect(
        await redirectFor({ returnTo: CYA, documentsOutstanding: ['GOV1'] })
      ).toBe(marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES)
    })
  })

  describe('return links', () => {
    const CYA_CARD_LINK = `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#document-card-1`

    const render = async ({ returnTo, documentsOutstanding, referer } = {}) => {
      vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          marinePlanPolicySupportingDocuments: {
            linkedDocuments: [mockLinkedMarinePlanPolicyDocument],
            documentsOutstanding
          }
        })
      })
      const request = {
        headers: { referer },
        yar: { get: vi.fn().mockReturnValue(returnTo) }
      }
      const h = { view: vi.fn() }

      await marinePlanPolicyDocumentsReviewController.handler(request, h)

      return { request, context: h.view.mock.calls[0][1] }
    }

    test('returns to the check your answers card when a return path is cached', async () => {
      const { request, context } = await render({
        returnTo: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      })

      expect(request.yar.get).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
      expect(context.backLink).toBe(CYA_CARD_LINK)
      expect(context.continueLink).toBe(CYA_CARD_LINK)
    })

    test('continues to the marine plan policies page when documents are outstanding', async () => {
      const { context } = await render({
        returnTo: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
        documentsOutstanding: ['GOV1']
      })

      expect(context.backLink).toBe(CYA_CARD_LINK)
      expect(context.continueLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      )
    })

    test('returns to the marine plan policies page when no return path is cached', async () => {
      const { context } = await render()

      expect(context.backLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      )
      expect(context.continueLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      )
    })

    test('ignores a referrer from the delete page because that document no longer exists', async () => {
      const deleteUrl =
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT.replace(
          '{documentId}',
          'doc-1'
        )

      const { context } = await render({
        referer: `http://localhost${deleteUrl}`
      })

      expect(context.backLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      )
    })
  })
})
