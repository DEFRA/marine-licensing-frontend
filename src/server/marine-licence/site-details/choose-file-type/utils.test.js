import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getChooseFileTypeBackLink,
  getChooseFileTypeCancelLink
} from '#src/server/marine-licence/site-details/choose-file-type/utils.js'

describe('getChooseFileTypeBackLink', () => {
  it('returns change-site-location when singleSiteMode is true', () => {
    expect(getChooseFileTypeBackLink(true)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION
    )
  })

  it('returns coordinates-type-choice when singleSiteMode is false', () => {
    expect(getChooseFileTypeBackLink(false)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
    )
  })
})

describe('getChooseFileTypeCancelLink', () => {
  it('returns review-site-details when singleSiteMode is true', () => {
    expect(getChooseFileTypeCancelLink(true)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  it('returns task list cancel link when singleSiteMode is false', () => {
    expect(getChooseFileTypeCancelLink(false)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
    )
  })
})
