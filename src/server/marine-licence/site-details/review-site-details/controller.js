import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import { clearReturnToCache } from '#src/server/common/helpers/marine-licence/session-cache/return-to-cache.js'
import { renderFileUploadReview, renderManualEntryReview } from './utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import {
  clearSavedMarineLicenceSiteDetails,
  clearSingleSiteMode,
  getMarineLicenceCache,
  setMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { storeMarinePlanPolicyQueryStartTime } from '#src/server/common/helpers/marine-licence/marine-plan-policy-wait.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  authenticatedPatchRequest,
  authenticatedPostRequest
} from '#src/server/common/helpers/authenticated-requests.js'
import { finishedSiteDetailsSchema } from '#src/server/common/validation/finished-site-details/schema.js'
import { finishedSiteDetailsErrorMessages } from '#src/server/common/validation/finished-site-details/constants.js'
import {
  mapErrorsForDisplay,
  errorDescriptionByFieldName
} from '#src/server/common/helpers/errors.js'

export const FILE_UPLOAD_REVIEW_VIEW_ROUTE =
  'marine-licence/site-details/review-site-details/file-upload-review'

const reviewSiteDetailsPageData = {
  pageTitle: 'Review site details',
  heading: 'Review site details'
}

function renderReviewSiteDetails(h, options) {
  const { marineLicence, siteDetails } = options

  const firstSite = getSiteDetailsBySite({
    ...marineLicence,
    siteDetails
  })
  const { coordinatesType } = firstSite

  if (coordinatesType === 'file') {
    return renderFileUploadReview(h, options)
  }

  if (coordinatesType === 'coordinates') {
    return renderManualEntryReview(h, options)
  }

  return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
}

export const reviewSiteDetailsController = {
  async handler(request, h) {
    const previousPage = request.headers?.referer
    const marineLicence = getMarineLicenceCache(request)
    const fromCheckYourAnswers = request.query?.from === 'check-your-answers'

    await clearSavedMarineLicenceSiteDetails(request, h)
    await clearSingleSiteMode(request, h)

    if (!marineLicence.id) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const completeMarineLicence =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)

    const { projectName, siteDetails, siteDetailsDataComplete } =
      completeMarineLicence

    await setMarineLicenceCache(request, h, {
      id: marineLicence.id,
      projectName,
      siteDetails
    })

    const returnToCheckYourAnswers = fromCheckYourAnswers
      ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      : false

    return renderReviewSiteDetails(h, {
      marineLicence: completeMarineLicence,
      siteDetails,
      previousPage,
      reviewSiteDetailsPageData,
      returnToCheckYourAnswers,
      showMarinePlanPoliciesQuestion: siteDetailsDataComplete
    })
  }
}

async function handleAddSite(request, h, marineLicence) {
  const newSiteNumber = marineLicence.siteDetails.length + 1
  await updateMarineLicenceSiteDetails(
    request,
    h,
    newSiteNumber - 1,
    'coordinatesType',
    'coordinates'
  )
  return h.redirect(
    `${marineLicenceRoutes.MARINE_LICENCE_SITE_NAME}?site=${newSiteNumber}`
  )
}

async function handleAddActivity(request, h, marineLicence, siteNumber) {
  const siteIndex = Number.parseInt(siteNumber, 10) - 1

  const currentActivityCount =
    marineLicence.siteDetails[siteIndex].activityDetails.length

  const newActivityIndex = currentActivityCount + 1

  await authenticatedPatchRequest(request, apiRoutes.ADD_ACTIVITY_TO_SITE, {
    siteIndex,
    id: marineLicence.id
  })

  return h.redirect(
    `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${newActivityIndex}`
  )
}

function handleReturnToRedirect(request, h) {
  const returnTo = request.yar.flash(RETURN_TO_CACHE_KEY)
  const redirectPath = Array.isArray(returnTo) ? returnTo[0] : returnTo

  if (!redirectPath) {
    return { redirected: false }
  }

  return { redirected: true, response: h.redirect(redirectPath) }
}

function handleFinishedSiteDetailsValidation(
  request,
  h,
  completeMarineLicence,
  siteDetails,
  returnToCheckYourAnswers
) {
  const { error, value } = finishedSiteDetailsSchema.validate(request.payload)

  if (!error) {
    return { valid: true, value }
  }

  const errorSummary = mapErrorsForDisplay(
    error.details,
    finishedSiteDetailsErrorMessages
  )
  const errors = errorDescriptionByFieldName(errorSummary)

  return {
    valid: false,
    response: renderReviewSiteDetails(h, {
      marineLicence: completeMarineLicence,
      siteDetails,
      previousPage: request.headers?.referer,
      reviewSiteDetailsPageData,
      returnToCheckYourAnswers,
      showMarinePlanPoliciesQuestion: true,
      errors,
      errorSummary
    })
  }
}

async function confirmSiteDetails(
  request,
  h,
  marineLicence,
  value,
  { siteDetailsAlreadyConfirmed, returnToCheckYourAnswers }
) {
  const hasFinishedEnteringSiteDetails =
    value.finishedEnteringSiteDetails === 'yes'

  await authenticatedPatchRequest(request, apiRoutes.CONFIRM_SITE_DETAILS, {
    id: marineLicence.id,
    confirmed: hasFinishedEnteringSiteDetails
  })

  if (!hasFinishedEnteringSiteDetails) {
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
  }

  if (siteDetailsAlreadyConfirmed && returnToCheckYourAnswers) {
    return h.redirect(returnToCheckYourAnswers)
  }

  await authenticatedPostRequest(
    request,
    apiRoutes.CALCULATE_MARINE_PLAN_POLICIES,
    JSON.stringify({ id: marineLicence.id })
  )
  storeMarinePlanPolicyQueryStartTime(request)
  return h.redirect(
    marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
  )
}

export const reviewSiteDetailsSubmitController = {
  async handler(request, h) {
    const { payload } = request
    const { add, addActivity, siteNumber } = payload
    const marineLicence = getMarineLicenceCache(request)
    const fromCheckYourAnswers = request.query?.from === 'check-your-answers'
    const returnToCheckYourAnswers = fromCheckYourAnswers
      ? marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      : false

    if (add) {
      return handleAddSite(request, h, marineLicence)
    }

    if (addActivity) {
      return handleAddActivity(request, h, marineLicence, siteNumber)
    }

    const marineLicenceService = getMarineLicenceService(request)
    const completeMarineLicence =
      await marineLicenceService.getMarineLicenceById(marineLicence.id)
    const { siteDetails, siteDetailsDataComplete } = completeMarineLicence

    if (!siteDetailsDataComplete) {
      const returnTo = handleReturnToRedirect(request, h)
      if (returnTo.redirected) {
        return returnTo.response
      }
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    clearReturnToCache(request)

    const validation = handleFinishedSiteDetailsValidation(
      request,
      h,
      completeMarineLicence,
      siteDetails,
      returnToCheckYourAnswers
    )
    if (!validation.valid) {
      return validation.response
    }

    return confirmSiteDetails(request, h, marineLicence, validation.value, {
      siteDetailsAlreadyConfirmed: completeMarineLicence.siteDetailsConfirmed,
      returnToCheckYourAnswers
    })
  }
}
