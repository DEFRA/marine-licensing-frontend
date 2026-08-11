import { ACTIVITY_LABELS } from '#src/server/common/constants/activities.js'
import {
  formatActivitySubTypeLabel,
  getOtherActivityLabel
} from '#src/server/common/helpers/review-site-details/activity-details.js'

export const ACTIVITY_TYPE_LABELS = {
  construction: 'Construction, alteration or improvement of any works',
  deposit: 'Deposit of any substance or object',
  removal: 'Removal of any substance or object'
}

export const resolveActivityTypeLabel = (activityType) =>
  ACTIVITY_TYPE_LABELS[activityType] ?? null

export const resolveSelectionLabel = (
  selection,
  activityType,
  otherActivity
) => {
  if (selection === 'other') {
    return getOtherActivityLabel(activityType, otherActivity)
  }

  return ACTIVITY_LABELS[selection] ?? selection ?? null
}

/**
 * Adds snapshot labels so Mongo (and Dynamics) keep applicant-era wording.
 * Keys remain the source of form logic; labels are display text at save time.
 */
export const snapshotActivityLabels = (activity = {}) => {
  if (!activity || typeof activity !== 'object') {
    return activity
  }

  const { activityType, activitySubType, activities } = activity

  const next = { ...activity }

  if (activityType) {
    next.activityTypeLabel = resolveActivityTypeLabel(activityType)
  }

  if (activitySubType) {
    next.activitySubTypeLabel = formatActivitySubTypeLabel(activitySubType)
  }

  if (activities && typeof activities === 'object') {
    const selections = Array.isArray(activities.selections)
      ? activities.selections
      : [activities.selections].filter(Boolean)

    next.activities = {
      ...activities,
      selections,
      selectionLabels: selections.map((selection) =>
        resolveSelectionLabel(selection, activityType, activities.otherActivity)
      )
    }
  }

  return next
}

export const snapshotActivityDetails = (activityDetails) =>
  Array.isArray(activityDetails)
    ? activityDetails.map(snapshotActivityLabels)
    : activityDetails
