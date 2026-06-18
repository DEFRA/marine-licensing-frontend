import { getBackLink } from '#src/server/marine-licence/water-framework-directive/review-your-answers/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { waterFrameworkDirective } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('getBackLink', () => {
  const mockRequest = createMockRequest()

  test('returns check-your-answers link when query.from is check-your-answers', () => {
    const mockRequestFromCYA = createMockRequest({
      query: { from: 'check-your-answers' }
    })

    expect(getBackLink(mockRequestFromCYA, waterFrameworkDirective)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
    )
  })

  test('returns excluded-activities link when excludedActivities is yes', () => {
    expect(
      getBackLink(mockRequest, {
        ...waterFrameworkDirective,
        excludedActivities: 'yes'
      })
    ).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  })

  test('returns file-upload link when excludedActivities is no', () => {
    expect(getBackLink(mockRequest, waterFrameworkDirective)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  })

  test('returns file-upload link when excludedActivities is undefined', () => {
    expect(getBackLink(mockRequest)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  })

  test('returns task-list link when previous page is task list', () => {
    const mockRequestFromTaskList = createMockRequest({
      headers: {
        referer: `http://example.com${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}`
      }
    })

    expect(getBackLink(mockRequestFromTaskList, waterFrameworkDirective)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
