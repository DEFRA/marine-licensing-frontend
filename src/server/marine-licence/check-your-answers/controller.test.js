import { vi } from 'vitest'
import {
  getMarineLicenceCache,
  setMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  checkYourAnswersController,
  CHECK_YOUR_ANSWERS_VIEW_ROUTE
} from '#src/server/marine-licence/check-your-answers/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import * as marineLicenceServiceModule from '#src/services/marine-licence-service/index.js'

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
      id: '123',
      projectName: 'Test Project',
      specialLegalPowers: {
        agree: 'yes',
        details: 'We have statutory powers under the Marine Act.'
      }
    }

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(getMarineLicenceCacheMock).toHaveBeenCalledWith(mockRequest)
    expect(mockH.view).toHaveBeenCalledWith(CHECK_YOUR_ANSWERS_VIEW_ROUTE, {
      pageTitle: 'Check your answers before sending your information',
      backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      ...mockCachedData
    })
  })

  test('should enter if block when specialLegalPowers missing and id exists', async () => {
    const mockCachedData = {
      id: '123',
      projectName: 'Test Project'
    }

    const dbResponse = {
      specialLegalPowers: {
        agree: 'yes',
        details: 'From DB'
      }
    }

    getMarineLicenceCacheMock.mockReturnValue(mockCachedData)

    const mockService = {
      getMarineLicenceById: vi.fn().mockResolvedValue(dbResponse)
    }

    vi.spyOn(
      marineLicenceServiceModule,
      'getMarineLicenceService'
    ).mockReturnValue(mockService)

    const setCacheMock = vi.mocked(setMarineLicenceCache)

    await checkYourAnswersController.handler(mockRequest, mockH)

    expect(mockService.getMarineLicenceById).toHaveBeenCalledWith('123')

    expect(setCacheMock).toHaveBeenCalled()

    expect(mockH.view).toHaveBeenCalledWith(
      CHECK_YOUR_ANSWERS_VIEW_ROUTE,
      expect.objectContaining({
        specialLegalPowers: dbResponse.specialLegalPowers
      })
    )
  })
})
