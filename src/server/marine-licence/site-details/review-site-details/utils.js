import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { FILE_UPLOAD_REVIEW_VIEW_ROUTE } from './controller.js'
import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { createSiteDetailsDataJson } from '#src/server/common/helpers/site-details.js'
import { parseActivityDetails } from '#src/server/common/helpers/review-site-details/activity-details.js'
import { buildManualCoordinateSummaryData } from '#src/server/common/helpers/review-site-details/manual-entry.js'
import { SUBTYPES_REQUIRING_CONSTRUCTION_DRAWING } from '#src/server/marine-licence/site-details/type-of-activity/constants.js'

export const MANUAL_ENTRY_REVIEW_VIEW_ROUTE =
  'marine-licence/site-details/review-site-details/index'

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

  if (previousPath === marineLicenceRoutes.MARINE_LICENCE_TASK_LIST) {
    return marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
  }

  return previousPath
}

export const getManualEntryBackLink = (
  previousPage,
  returnToCheckYourAnswers = false
) => {
  if (returnToCheckYourAnswers) {
    return typeof returnToCheckYourAnswers === 'string'
      ? returnToCheckYourAnswers
      : marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
  }

  if (!previousPage || !URL.canParse(previousPage)) {
    return marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
  }

  const url = new URL(previousPage)
  const previousPath = url.pathname
  const siteParam = url.searchParams.get('site')
  const queryParams = siteParam ? `?site=${siteParam}` : ''

  if (
    previousPath ===
    marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
  ) {
    return `${marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES}${queryParams}`
  }

  if (previousPath === marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE) {
    return `${marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE}${queryParams}`
  }

  if (previousPath === marineLicenceRoutes.MARINE_LICENCE_TASK_LIST) {
    return marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
  }

  return marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
}

export const renderFileUploadReview = (h, options) => {
  const {
    marineLicence,
    previousPage,
    siteDetails,
    reviewSiteDetailsPageData,
    returnToCheckYourAnswers = false,
    showMarinePlanPoliciesQuestion = false,
    errors,
    errorSummary
  } = options

  const summaryData = siteDetails.map((site, index) => {
    const fileUploadSummaryData = getFileUploadSummaryData({
      ...marineLicence,
      siteDetails: site
    })

    const activityDetails = parseActivityDetails(site).map(
      (activity, actIndex) => ({
        ...activity,
        ...(actIndex > 0 && {
          deleteLink: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY}?site=${index + 1}&activity=${actIndex + 1}`
        })
      })
    )

    const siteDetailsData = createSiteDetailsDataJson(site)

    return {
      ...fileUploadSummaryData,
      siteName: site.siteName,
      siteNumber: index + 1,
      siteDetailsData,
      activityDetails,
      constructionDrawings: site.constructionDrawings
    }
  })

  return h.view(FILE_UPLOAD_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getFileUploadBackLink(previousPage, returnToCheckYourAnswers),
    projectName: marineLicence.projectName,
    hasIncompleteFields: hasIncompleteFields(siteDetails),
    summaryData,
    showMarinePlanPoliciesQuestion,
    errors,
    errorSummary
  })
}

export const renderManualEntryReview = (h, options) => {
  const {
    marineLicence,
    previousPage,
    siteDetails,
    reviewSiteDetailsPageData,
    returnToCheckYourAnswers = false,
    showMarinePlanPoliciesQuestion = false,
    errors,
    errorSummary
  } = options

  const summaryData = buildManualCoordinateSummaryData(
    siteDetails,
    marineLicence.multipleSiteDetails ?? {}
  ).map((site, index) => ({
    ...site,
    deleteSiteLink: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_SITE}?site=${index + 1}`,
    constructionDrawings: siteDetails[index]?.constructionDrawings,
    activityDetails: site.activityDetails.map((activity, actIndex) => ({
      ...activity,
      ...(actIndex > 0 && {
        deleteLink: `${marineLicenceRoutes.MARINE_LICENCE_DELETE_ACTIVITY}?site=${index + 1}&activity=${actIndex + 1}`
      })
    }))
  }))

  return h.view(MANUAL_ENTRY_REVIEW_VIEW_ROUTE, {
    ...reviewSiteDetailsPageData,
    backLink: getManualEntryBackLink(previousPage, returnToCheckYourAnswers),
    projectName: marineLicence.projectName,
    summaryData,
    showMarinePlanPoliciesQuestion,
    errors,
    errorSummary
  })
}

const siteRequiresConstructionDrawing = (site) =>
  (site.activityDetails ?? []).some((activity) =>
    SUBTYPES_REQUIRING_CONSTRUCTION_DRAWING.includes(activity.activitySubType)
  )

const isMissingConstructionDrawing = (site) =>
  siteRequiresConstructionDrawing(site) &&
  !site.constructionDrawings?.[0]?.s3Location

const hasMissingRequiredFields = (site) => {
  const isSiteNameMissing = !site.siteName || site.siteName.trim() === ''
  return isSiteNameMissing || isMissingConstructionDrawing(site)
}

export const hasIncompleteFields = (siteDetails) => {
  if (!siteDetails || siteDetails.length === 0) {
    return false
  }

  return siteDetails.some((site) => hasMissingRequiredFields(site))
}
