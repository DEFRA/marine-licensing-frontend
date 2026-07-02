import {
  getBackLink,
  getCancelLink
} from '#src/server/marine-licence/water-framework-directive/file-upload/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('getBackLink', () => {
  test('returns excluded-activities when fileUploadEntryPoint is excluded-activities', () => {
    expect(getBackLink('excluded-activities')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  })

  test('returns excluded-activities when fileUploadEntryPoint is undefined', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  })

  test('returns review-your-answers when fileUploadEntryPoint is review-your-answers', () => {
    expect(getBackLink('review-your-answers')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })
})

describe('getCancelLink', () => {
  test('returns task-list when returnTo is not defined', () => {
    expect(getCancelLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('returns task-list when returnTo is excluded-activities', () => {
    expect(
      getCancelLink(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
      )
    ).toBe(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  })

  test('returns undefined when returnTo is review-your-answers', () => {
    expect(
      getCancelLink(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      )
    ).toBeUndefined()
  })
})
