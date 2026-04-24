import { ACTIVITY_LABELS } from '#src/server/common/constants/activities.js'
import { getActivityVariantFromSubType } from '#src/server/common/helpers/activity-details/activity-variants.js'

const ACTIVITY_SUB_TYPE_MAP = {
  'construction-type-1': {
    label: 'Construction of new works',
    heading: "What you're constructing"
  },
  'construction-type-2': {
    label: 'Maintenance of existing works',
    heading: "What you're maintaining"
  },
  'construction-type-3': {
    label:
      'Alteration or improvement, including extending, of existing marine works',
    heading: "What you're altering or improving"
  },
  'deposit-type-1': {
    label: 'Continuation of existing deposit activity',
    heading: "What deposit activity you're continuing"
  },
  'deposit-type-2': {
    label: 'Deposit of something new',
    heading: "What new deposit activity you're doing"
  },
  'deposit-type-3': {
    label: 'Replacing existing object',
    heading:
      "What deposit activity you're doing that replaces an existing object"
  },
  'removal-type-1': {
    label: 'One off first time removal',
    heading: "What you're removing for the first time on a one off basis"
  },
  'removal-type-2': {
    label: 'Removal as part of an ongoing or routine activity',
    heading: "What you're removing on an ongoing basis"
  },
  'removal-type-3': {
    label: 'Removal for replacement',
    heading: "What you're removing as part of replacement activity"
  },
  'removal-type-4': {
    label: 'Removal for relocation',
    heading: "What you're removing for relocation"
  }
}

const OTHER_ACTIVITY_PREFIXES = {
  construction: 'Other structures',
  deposit: 'Other deposits',
  removal: 'Other substances or objects'
}

export const formatActivitySubTypeHeading = (activitySubType) =>
  ACTIVITY_SUB_TYPE_MAP[activitySubType]?.heading ?? null

export const formatActivitySubTypeLabel = (activitySubType) =>
  ACTIVITY_SUB_TYPE_MAP[activitySubType]?.label ?? null

export const getOtherActivityLabel = (activityType, otherText) => {
  const prefix = OTHER_ACTIVITY_PREFIXES[activityType]
  return prefix ? `${prefix}: ${otherText}` : otherText
}

export const mapActivitySelections = (activities, activityType) =>
  (activities?.selections ?? []).map((selection) =>
    selection === 'other'
      ? getOtherActivityLabel(activityType, activities.otherActivity)
      : ACTIVITY_LABELS[selection]
  )

export const parseActivityDetails = (siteDetails) => {
  const activityDetails = siteDetails.activityDetails ?? []

  return activityDetails.map((activity) => ({
    ...activity,
    activitySubType: formatActivitySubTypeLabel(activity.activitySubType),
    activityHeading: formatActivitySubTypeHeading(activity.activitySubType),
    activityLink: `/marine-licence/activity-details/${getActivityVariantFromSubType(activity.activitySubType)}`,
    activities: mapActivitySelections(
      activity.activities,
      activity.activityType
    )
  }))
}
