import { vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  REVIEW_YOUR_ANSWERS_VIEW_ROUTE,
  waterFrameworkReviewYourAnswersController,
  reviewYourAnswersSubmitController
} from '#src/server/marine-licence/water-framework-directive/review-your-answers/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

function createMockHandler(type = 'view') {
  if (type === 'redirect') {
    return { redirect: vi.fn() }
  }
  return { view: vi.fn() }
}

describe('#reviewYourAnswers', () => {
  const mockRequest = createMockRequest()

  describe('waterFrameworkReviewYourAnswersController', () => {
    test('renders view with file-upload back link when excludedActivities is not yes', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        projectName: 'Test Project',
        waterFrameworkDirective: { excludedActivities: 'no' }
      })

      const h = createMockHandler()

      await waterFrameworkReviewYourAnswersController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        REVIEW_YOUR_ANSWERS_VIEW_ROUTE,
        expect.objectContaining({
          pageTitle: 'Check your answers for Water Framework Directive',
          heading: 'Check your answers for Water Framework Directive',
          projectName: 'Test Project',
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
        })
      )
    })

    test('renders view with excluded-activities back link when excludedActivities is yes', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        projectName: 'Test Project',
        waterFrameworkDirective: { excludedActivities: 'yes' }
      })

      const h = createMockHandler()

      await waterFrameworkReviewYourAnswersController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        REVIEW_YOUR_ANSWERS_VIEW_ROUTE,
        expect.objectContaining({
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
        })
      )
    })

    test('renders view with file-upload back link when waterFrameworkDirective is absent', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        projectName: 'Test Project'
      })

      const h = createMockHandler()

      await waterFrameworkReviewYourAnswersController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        REVIEW_YOUR_ANSWERS_VIEW_ROUTE,
        expect.objectContaining({
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
        })
      )
    })
  })

  describe('reviewYourAnswersSubmitController', () => {
    test('redirects to task list on submit when no returnTo session value is set', async () => {
      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: {} })
      request.yar.get.mockReturnValue(null)

      await reviewYourAnswersSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('redirects to check-your-answers with anchor on submit when returnTo session value is set', async () => {
      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: {} })
      request.yar.get.mockReturnValue(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )

      await reviewYourAnswersSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS +
          '#water-framework-directive-card'
      )
    })
  })
})
