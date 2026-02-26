import { vi } from 'vitest'
import { getMarineLicenseCache } from '#src/server/common/helpers/marine-license/session-cache/utils.js'
import {
  checkYourAnswersController,
  CHECK_YOUR_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-license/check-your-answers/controller.js'
import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/marine-license/session-cache/utils.js')

describe('#checkYourAnswersController', () => {
  let mockRequest
  let mockH

  const getMarineLicenseCacheMock = vi.mocked(getMarineLicenseCache)

  beforeEach(() => {
    mockH = {
      view: vi.fn()
    }
    mockRequest = {
      yar: {}
    }
  })

  test('handler should render with correct context', async () => {
    const mockCachedData = {
      id: '123',
      projectName: 'Test Project'
    }

    getMarineLicenseCacheMock.mockReturnValue(mockCachedData)

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenseCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST,
      ...mockCachedData
    })
  })
})
