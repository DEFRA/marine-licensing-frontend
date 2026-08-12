import { SUBTYPES_REQUIRING_CONSTRUCTION_DRAWING } from '#src/server/marine-licence/site-details/type-of-activity/constants.js'

export const getSiteDetailsBySite = (project, siteIndex = 0) =>
  project.siteDetails?.[siteIndex] ?? {}

export const getActivityDetailsByIndex = (
  project,
  siteIndex = 0,
  activityIndex = 0
) => project.siteDetails?.[siteIndex].activityDetails[activityIndex] ?? {}

export const siteHasOtherActivityRequiringDrawing = (
  project,
  siteIndex,
  activityDetailsIndex
) => {
  const activityDetails =
    project.siteDetails?.[siteIndex]?.activityDetails ?? []

  return activityDetails.some(
    (activity, index) =>
      index !== activityDetailsIndex &&
      SUBTYPES_REQUIRING_CONSTRUCTION_DRAWING.includes(activity.activitySubType)
  )
}
