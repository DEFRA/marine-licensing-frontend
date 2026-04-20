export const formatActivityType = (activitySubType) => {
  switch (activitySubType) {
    case 'construction-type-1':
      return "What you're constructing"
    case 'construction-type-2':
      return "What you're maintaining"
    case 'construction-type-3':
      return "What you're altering or improving"
    case 'deposit-type-1':
      return "What deposit activity you're continuing"
    case 'deposit-type-2':
      return "What new deposit activity you're doing"
    case 'deposit-type-3':
      return "What deposit activity you're doing that replaces an existing object"
    case 'removal-type-1':
      return "What you're removing for the first time on a one off basis"
    case 'removal-type-2':
      return "What you're removing on an ongoing basis"
    case 'removal-type-3':
      return "What you're removing as part of replacement activity"
    case 'removal-type-4':
      return "What you're removing for relocation"
    default:
      return null
  }
}

export const parseActivityDetails = (siteDetails) => {
  const activityDetails = siteDetails.activityDetails || []

  return activityDetails.map((activity) => ({
    ...activity,
    activitySubType: formatActivityType(activity.activitySubType)
  }))
}
