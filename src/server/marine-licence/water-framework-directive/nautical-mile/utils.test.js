import {
  getBackLink,
  getCancelLink
} from '#src/server/marine-licence/water-framework-directive/nautical-mile/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('getBackLink', () => {
  test('returns review-your-answers when action is set', () => {
    expect(getBackLink(null, 'change')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })

  test('returns review-your-answers when both action and returnTo are set', () => {
    expect(
      getBackLink(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
        'change'
      )
    ).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })

  test('returns check-your-answers link with anchor when returnTo is set', () => {
    expect(
      getBackLink(marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS)
    ).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
    )
  })

  test('returns before-you-start link when returnTo is null', () => {
    expect(getBackLink(null)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
    )
  })

  test('returns before-you-start link when returnTo is undefined', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
    )
  })
})

describe('getCancelLink', () => {
  test('returns undefined when action is set', () => {
    expect(getCancelLink(null, 'change')).toBeUndefined()
  })

  test('returns undefined when both action and returnTo are set', () => {
    expect(
      getCancelLink(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS,
        'change'
      )
    ).toBeUndefined()
  })

  test('returns check-your-answers link with anchor when returnTo is set', () => {
    expect(
      getCancelLink(marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS)
    ).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS}#water-framework-directive-card`
    )
  })

  test('returns task list when returnTo is null', () => {
    expect(getCancelLink(null)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('returns task list when returnTo is undefined', () => {
    expect(getCancelLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})
