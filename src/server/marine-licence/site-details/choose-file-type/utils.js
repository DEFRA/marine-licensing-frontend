import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getChooseFileTypeBackLink = (isSingleSiteMode) =>
  isSingleSiteMode
    ? marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION
    : marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE

export const getChooseFileTypeCancelLink = (isSingleSiteMode) =>
  isSingleSiteMode
    ? marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    : `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
