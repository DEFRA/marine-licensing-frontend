export const selectActivityErrorMessages = (activityType) => {
  if (activityType === 'construction') {
    return {
      ACTIVITIES_REQUIRED: 'Select at least one type of structure',
      ACTIVITIES_OTHER_REASON_REQUIRED: 'Enter details of the other structures'
    }
  } else if (activityType === 'deposit') {
    return {
      ACTIVITIES_REQUIRED: 'Select at least one type of substance or object',
      ACTIVITIES_OTHER_REASON_REQUIRED: 'Enter details of the other structures'
    }
  } else if (activityType === 'removal') {
    return {
      ACTIVITIES_REQUIRED: 'Select at least one substance or object',
      ACTIVITIES_OTHER_REASON_REQUIRED:
        'Enter details of the other substances or objects'
    }
  }
}
