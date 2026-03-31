import { config } from '#src/config/config.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { FILE_UPLOAD_REVIEW_VIEW_ROUTE } from './controller.js'

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

  return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getFileUploadBackLink(previousPage, returnToCheckYourAnswers),
    projectName: marineLicence.projectName,
    configEnv: config.get('env'),
    hasIncompleteFields: hasIncompleteFields(siteDetails)
  })
}

const hasMissingRequiredFields = (site) => {
  const isSiteNameMissing = !site.siteName || site.siteName.trim() === ''
  return isSiteNameMissing
}

export const hasIncompleteFields = (siteDetails, multipleSiteDetails) => {
  if (!siteDetails || siteDetails.length === 0) {
    return false
  }

  return siteDetails.some((site) => hasMissingRequiredFields(site))
}
