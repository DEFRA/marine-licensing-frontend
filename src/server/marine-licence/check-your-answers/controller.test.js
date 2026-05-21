import { vi } from 'vitest'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  checkYourAnswersController,
  CHECK_YOUR_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-licence/check-your-answers/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#checkYourAnswersController', () => {
  let mockRequest
  let mockH

  const getMarineLicenceCacheMock = vi.mocked(getMarineLicenceCache)

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
      ...mockMarineLicenceApplication,
      publicRegisterRoute:
        '/marine-licence/sharing-your-project-information-publicly'
    }

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData,
      preferredDates: 'July 2026 to August 2027'
    })
  })
})
