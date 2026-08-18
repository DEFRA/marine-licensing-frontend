import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import {
  getCancelLink,
  getContinueLink
} from '#src/server/marine-licence/fee-estimate/utils.js'

describe('#getCancelLink', () => {
  test('should return undefined when navigated from check your answers', () => {
    const request = createMockRequest()
    request.yar.get.mockReturnValue(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )

    expect(getCancelLink(request)).toBeUndefined()
  })

  test('should return task list route when not navigated from check your answers', () => {
    const request = createMockRequest()

    expect(getCancelLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})

describe('#getContinueLink', () => {
  test('should append the fee estimate anchor to the check your answers route', () => {
    const request = createMockRequest()
    request.yar.get.mockReturnValue(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )

    expect(getContinueLink(request)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#fee-estimate-card`
    )
  })

  test('should not append the fee estimate anchor to the task list route', () => {
    const request = createMockRequest()

    expect(getContinueLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
