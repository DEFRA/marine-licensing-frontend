import {
  getBackLink,
  getCancelLink,
  getSubmitRedirect
} from '#src/server/marine-licence/water-framework-directive/excluded-activities/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const RYA_ROUTE =
  marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS

describe('getBackLink', () => {
  test('returns returnTo when set', () => {
    expect(getBackLink(RYA_ROUTE)).toBe(RYA_ROUTE)
  })

  test('returns nautical-mile when returnTo is not defined', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
    )
  })
})

describe('getCancelLink', () => {
  test('returns undefined when returnTo is set', () => {
    expect(getCancelLink(RYA_ROUTE)).toBeUndefined()
  })

  test('returns task list is other all other scenarios', () => {
    expect(getCancelLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })
})

describe('getSubmitRedirect', () => {
  test('returns file-upload when excludedActivities is no', () => {
    expect(getSubmitRedirect('no')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  })

  test('returns returnTo when excludedActivities is yes and returnTo is set', () => {
    expect(getSubmitRedirect('yes', RYA_ROUTE)).toBe(RYA_ROUTE)
  })

  test('returns review-your-answers when excludedActivities is yes', () => {
    expect(getSubmitRedirect('yes')).toBe(RYA_ROUTE)
  })
})
