import { activityTypes } from '~/src/server/common/constants/mcms-context.js'

export const transformMcmsContextForDisplay = (mcmsContext) => {
  if (!mcmsContext) {
    return null
  }
  return {
    ...mcmsContext,
    activityType: activityTypes[mcmsContext.activityType]
  }
}
