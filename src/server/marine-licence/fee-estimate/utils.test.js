import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getCancelLink,
  getContinueLink
} from '#src/server/marine-licence/fee-estimate/utils.js'

describe('#getCancelLink', () => {
  test('should return undefined when navigated from check your answers', () => {
    const request = { query: { from: 'check-your-answers' } }

    expect(getCancelLink(request)).toBeUndefined()
  })

  test('should return task list route when not navigated from check your answers', () => {
    const request = { query: {} }

    expect(getCancelLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should return task list route when query is missing', () => {
    const request = {}

    expect(getCancelLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})

describe('#getContinueLink', () => {
  test('should append the fee estimate anchor to the check your answers route', () => {
    const request = { query: { from: 'check-your-answers' } }

    expect(getContinueLink(request)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#fee-estimate-card`
    )
  })

  test('should not append the fee estimate anchor to the task list route', () => {
    const request = { query: {} }

    expect(getContinueLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('should not append the fee estimate anchor to the task list route when query is missing', () => {
    const request = {}

    expect(getContinueLink(request)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
