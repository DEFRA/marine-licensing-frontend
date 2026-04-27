const activityErrorMessages = {
  construction: {
    ACTIVITIES_REQUIRED: 'Select at least one type of structure',
    ACTIVITIES_OTHER_REASON_REQUIRED: 'Enter details of the other structures',
    ACTIVITIES_OTHER_REASON_MAX_LENGTH:
      'Details of other structures must be 1000 characters or less'
  },
  deposit: {
    ACTIVITIES_REQUIRED: 'Select at least one type of substance or object',
    ACTIVITIES_OTHER_REASON_REQUIRED: 'Enter details of the other deposits',
    ACTIVITIES_OTHER_REASON_MAX_LENGTH:
      'Details of other deposits must be 1000 characters or less'
  },
  removal: {
    ACTIVITIES_REQUIRED: 'Select at least one substance or object',
    ACTIVITIES_OTHER_REASON_REQUIRED:
      'Enter details of the other substances or objects',
    ACTIVITIES_OTHER_REASON_MAX_LENGTH:
      'Details of the other substances or objects must be 1000 characters or less'
  }
}

export const selectActivityErrorMessages = (activityType) =>
  activityErrorMessages[activityType]
