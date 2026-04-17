export const formatActivityType = (activityType) => {
  switch (activityType) {
    case 'construction':
      return "What you're constructing"
    case 'deposit':
      return "What deposit activity you're continuing"
    case 'removal':
      return "What you're removing for the first time on a one off basis"
    default:
      return activityType
  }
}

export const parseActivityDetails = (activityDetails) =>
  activityDetails.map((activity) => ({
    ...activity,
    activityType: formatActivityType(activity.activityType)
  }))
