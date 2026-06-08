import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import {
  siteNameSettings,
  siteNameErrorMessages
} from '#src/server/common/validation/site-name/constants.js'
import { siteNameSchema } from '#src/server/common/validation/site-name/schema.js'
import {
  getSiteDataFromParam,
  hasInvalidSiteNumber
} from '#src/server/common/helpers/site-details/site-name.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { getCancelLink } from '#src/server/marine-licence/site-details/utils/cancel-link.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'
import { getSiteParam } from '#src/server/common/helpers/site-details/site-number-utils.js'

export const SITE_NAME_VIEW_ROUTE = 'templates/site-name.njk'

const getBackLink = (shouldReturnToReview, siteNumber) => {
  if (shouldReturnToReview) {
    return `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
  }
  if (siteNumber > 1) {
    return marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
  }
  return marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const marineLicence = getMarineLicenceCache(request)

  const { action } = request.query

  const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)

  const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)

  const shouldReturnToReview = action || siteDetails.coordinatesType === 'file'

  const errorViewSettings = {
    ...siteNameSettings,
    backLink: getBackLink(shouldReturnToReview, siteNumber),
    cancelLink: getCancelLink(shouldReturnToReview),
    payload,
    projectName: marineLicence.projectName,
    siteNumber,
    action: !!shouldReturnToReview
  }

  if (!err.details) {
    return h.view(SITE_NAME_VIEW_ROUTE, errorViewSettings).takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, siteNameErrorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(SITE_NAME_VIEW_ROUTE, {
      ...errorViewSettings,
      errors,
      errorSummary
    })
    .takeover()
}

export const siteNameController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    const { action, site } = request.query

    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)

    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)

    if (site && hasInvalidSiteNumber(siteNumber, marineLicence.siteDetails)) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const shouldReturnToReview =
      action || siteDetails.coordinatesType === 'file'

    const siteName = siteDetails.siteName ?? ''

    return h.view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: getBackLink(shouldReturnToReview, siteNumber),
      cancelLink: getCancelLink(shouldReturnToReview),
      projectName: marineLicence.projectName,
      siteNumber,
      action: !!shouldReturnToReview,
      payload: {
        siteName
      }
    })
  }
}

export const siteNameSubmitController = {
  options: {
    validate: {
      payload: siteNameSchema,
      failAction: createValidationFailAction
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { action } = request.query

    const { siteIndex, siteNumber } = getSiteDataFromParam(request.query)

    const marineLicence = getMarineLicenceCache(request)

    const siteDetails = getSiteDetailsBySite(marineLicence, siteIndex)

    const isFileUploadCoordinates = siteDetails.coordinatesType === 'file'
    const shouldReturnToReview = isFileUploadCoordinates || !!action

    const redirectRoute = shouldReturnToReview
      ? `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
      : `${marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE}${getSiteParam(siteNumber)}`

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'siteName',
      payload.siteName
    )

    if (shouldReturnToReview) {
      await saveSiteDetailsToBackend(request, h, { siteIndex })
    }

    return h.redirect(redirectRoute)
  }
}
