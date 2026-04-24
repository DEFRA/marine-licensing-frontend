import { selectActivityVariants } from '#src/server/common/constants/activity-variants.js'

const subTypeToVariant = Object.fromEntries(
  Object.entries(selectActivityVariants).map(([key, { activitySubType }]) => [
    activitySubType,
    key
  ])
)

export const getActivityVariantFromSubType = (activitySubType) =>
  subTypeToVariant[activitySubType]
