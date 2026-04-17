import { selectActivityVariants } from '#src/server/common/constants/activity-variants.js'

export const getActivityVariantFromSubType = (activitySubType) =>
  Object.entries(selectActivityVariants).find(
    ([, variant]) => variant.activitySubType === activitySubType
  )?.[0]
