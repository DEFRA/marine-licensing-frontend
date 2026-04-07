import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
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

export const SITE_NAME_VIEW_ROUTE = 'templates/site-name.njk'

const getBackLink = () => {
  return marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
}

const createValidationFailAction = (request, h, err) => {
  const { payload } = request
  const marineLicence = getMarineLicenceCache(request)

  const { action, site } = request.query

  const { siteNumber } = getSiteDataFromParam(site)

  if (!err.details) {
    return h
      .view(SITE_NAME_VIEW_ROUTE, {
        ...siteNameSettings,
        backLink: getBackLink(),
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
        payload,
        projectName: marineLicence.projectName,
        siteNumber,
        action
      })
      .takeover()
  }

  const errorSummary = mapErrorsForDisplay(err.details, siteNameErrorMessages)
  const errors = errorDescriptionByFieldName(errorSummary)

  return h
    .view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: getBackLink(),
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      payload,
      projectName: marineLicence.projectName,
      siteNumber,
      action,
      errors,
      errorSummary
    })
    .takeover()
}

export const siteNameController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)

    const { action, site } = request.query
    const { siteDetails } = marineLicence

    const { siteIndex, siteNumber } = getSiteDataFromParam(site)

    if (site && hasInvalidSiteNumber(siteNumber, siteDetails)) {
      return h.redirect(routes.TASK_LIST)
    }

    const siteName = siteDetails?.[siteIndex]?.siteName ?? ''

    return h.view(SITE_NAME_VIEW_ROUTE, {
      ...siteNameSettings,
      backLink: getBackLink(),
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      projectName: marineLicence.projectName,
      siteNumber,
      action,
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

    const { site } = request.query

    const { siteIndex } = getSiteDataFromParam(site)

    const redirectRoute = marineLicenceRoutes.MARINE_LICENCE_SITE_NAME

    await updateMarineLicenceSiteDetails(
      request,
      h,
      siteIndex,
      'siteName',
      payload.siteName
    )

    return h.redirect(redirectRoute)
  }
}
