const activityErrorMessages = {
  construction: {
    ACTIVITIES_REQUIRED: 'Select at least one type of structure',
    ACTIVITIES_OTHER_REASON_REQUIRED: 'Enter details of the other structures'
  },
  deposit: {
    ACTIVITIES_REQUIRED: 'Select at least one type of substance or object',
    ACTIVITIES_OTHER_REASON_REQUIRED: 'Enter details of the other deposits'
  },
  removal: {
    ACTIVITIES_REQUIRED: 'Select at least one substance or object',
    ACTIVITIES_OTHER_REASON_REQUIRED:
      'Enter details of the other substances or objects'
  }
}

export const selectActivityErrorMessages = (activityType) =>
  activityErrorMessages[activityType]
