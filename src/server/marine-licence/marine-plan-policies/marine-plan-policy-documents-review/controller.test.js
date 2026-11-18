import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import { marinePlanPolicyDocumentsReviewController } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-documents-review/controller.js'

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
})
