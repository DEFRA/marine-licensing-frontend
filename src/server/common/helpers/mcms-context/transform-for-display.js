import { activityTypes } from '#src/server/common/constants/mcms-context.js'

export const transformMcmsContextForDisplay = (mcmsContext) => {
  if (!mcmsContext) {
    return null
  }
  const { value, label, purpose } = activityTypes[mcmsContext.activityType]
  const purposeLabel = purpose?.find(
    (p) => p.article === mcmsContext.article
  )?.label

  return {
    ...mcmsContext,
    activityType: { value, label, purpose: purposeLabel }
  }
}
