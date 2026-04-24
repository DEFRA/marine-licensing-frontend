import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { FILE_UPLOAD_REVIEW_VIEW_ROUTE } from './controller.js'
import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'

export const getFileUploadBackLink = (
  previousPage,
  returnToCheckYourAnswers = false
) => {
  if (returnToCheckYourAnswers) {
    return typeof returnToCheckYourAnswers === 'string'
      ? returnToCheckYourAnswers
      : marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
  }

  if (!previousPage || !URL.canParse(previousPage)) {
    return marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname

  // If coming from task list, return to task list
  if (previousPath === routes.TASK_LIST) {
    return routes.TASK_LIST
  }

  // Otherwise, return to correct page for file upload upload journey
  return previousPath
}

export const renderFileUploadReview = (h, options) => {
  const {
    marineLicence,
    previousPage,
    siteDetails,
    reviewSiteDetailsPageData,
    returnToCheckYourAnswers = false
  } = options

  const summaryData = siteDetails.map((site, index) => {
    const fileUploadSummaryData = getFileUploadSummaryData({
      ...marineLicence,
      siteDetails: site
    })

    const activityDetails = parseActivityDetails(site)

    const siteDetailsData = createSiteDetailsDataJson(site)

    return {
      ...fileUploadSummaryData,
      siteName: site.siteName,
      siteNumber: index + 1,
      siteDetailsData,
      activityDetails
    }
  })

  return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getFileUploadBackLink(previousPage, returnToCheckYourAnswers),
    projectName: marineLicence.projectName,
    hasIncompleteFields: hasIncompleteFields(siteDetails),
    summaryData
  })
}

const hasMissingRequiredFields = (site) => {
  const isSiteNameMissing = !site.siteName || site.siteName.trim() === ''
  return isSiteNameMissing
}

export const hasIncompleteFields = (siteDetails) => {
  if (!siteDetails || siteDetails.length === 0) {
    return false
  }

  return siteDetails.some((site) => hasMissingRequiredFields(site))
}
