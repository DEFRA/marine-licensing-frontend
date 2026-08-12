import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { siteHasOtherActivityRequiringDrawing } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getActivityVariantFromSubType } from '#src/server/common/helpers/activity-details/activity-variants.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { deleteConstructionDrawingsRequest } from '#src/server/common/helpers/marine-licence/construction-drawings-request.js'
import { formatActivitySubTypeLabel } from '#src/server/common/helpers/review-site-details/activity-details.js'
import {
  activityTypeValues,
  activitySubTypeCodesByType,
  SUBTYPES_REQUIRING_CONSTRUCTION_DRAWING
} from '#src/server/marine-licence/site-details/type-of-activity/constants.js'

export const CONFIRM_CHANGE_ACTIVITY_TYPE_VIEW_ROUTE =
  'marine-licence/site-details/confirm-change-activity-type/index'

const CONFIRM_CHANGE_ACTIVITY_TYPE_PAGE_TITLE =
  'Changing your type of activity will delete any uploaded construction drawings'

const isValidActivitySelection = (activityType, activitySubType) =>
  activityTypeValues.includes(activityType) &&
  Boolean(activitySubTypeCodesByType[activityType]?.includes(activitySubType))

const drawingRequiringActivityLabels =
  SUBTYPES_REQUIRING_CONSTRUCTION_DRAWING.map(formatActivitySubTypeLabel)

export const confirmChangeActivityTypeController = {
  options: {
    pre: [validateSiteAndActivityParams]
  },
  handler(request, h) {
    const { activityType, activitySubType } = request.query

    if (
      !activityType ||
      !activitySubType ||
      !isValidActivitySelection(activityType, activitySubType)
    ) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, activityDetailsNumber } = getSiteDataFromParam(
      request.query
    )
    const typeOfActivityLink = `${marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY}?site=${siteNumber}&activity=${activityDetailsNumber}`

    return h.view(CONFIRM_CHANGE_ACTIVITY_TYPE_VIEW_ROUTE, {
      pageTitle: CONFIRM_CHANGE_ACTIVITY_TYPE_PAGE_TITLE,
      heading: CONFIRM_CHANGE_ACTIVITY_TYPE_PAGE_TITLE,
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      activityType,
      activitySubType,
      drawingRequiringActivityLabels,
      backLink: typeOfActivityLink,
      cancelLink: typeOfActivityLink
    })
  }
}

export const confirmChangeActivityTypeSubmitController = {
  options: {
    pre: [validateSiteAndActivityParams]
  },
  async handler(request, h) {
    const { site, activity, activityType, activitySubType } = request.payload

    if (!isValidActivitySelection(activityType, activitySubType)) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    const {
      siteIndex,
      siteNumber,
      activityDetailsIndex,
      activityDetailsNumber
    } = getSiteDataFromParam({ site, activity })

    const marineLicence = getMarineLicenceCache(request)
    const hasExistingDrawings =
      marineLicence.siteDetails[siteIndex]?.constructionDrawings?.length > 0
    const otherActivityStillRequiresDrawing =
      siteHasOtherActivityRequiringDrawing(
        marineLicence,
        siteIndex,
        activityDetailsIndex
      )

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        activityType,
        activitySubType,
        activities: null
      }
    )

    if (hasExistingDrawings && !otherActivityStillRequiresDrawing) {
      await updateMarineLicenceSiteDetails(
        request,
        h,
        siteIndex,
        'constructionDrawings',
        null
      )
      await deleteConstructionDrawingsRequest(request, {
        route: apiRoutes.DELETE_CONSTRUCTION_DRAWINGS,
        payload: { id: marineLicence.id, siteIndex },
        logAction: 'marine-licence:delete-construction-drawings-failed',
        reason: `siteIndex=${siteIndex}`,
        errorMessage: 'Error deleting construction drawings'
      })
    }

    const activityVariant = getActivityVariantFromSubType(activitySubType)

    return h.redirect(
      `/marine-licence/activity-details/${activityVariant}?site=${siteNumber}&activity=${activityDetailsNumber}`
    )
  }
}
