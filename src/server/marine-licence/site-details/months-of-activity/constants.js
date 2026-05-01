const monthsOfActivityHeading =
  'Will the activity be limited to specific months of the year?'

export const monthsOfActivitySettings = {
  pageTitle: monthsOfActivityHeading,
  heading: monthsOfActivityHeading
}

export const MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH = 1000

export const monthsOfActivityErrorMessages = {
  MONTHS_OF_ACTIVITY_REQUIRED:
    'Select whether the activity will be limited to specific months of the year',
  MONTHS_OF_ACTIVITY_DETAILS_REQUIRED:
    'Provide details of which months the activity will happen and why',
  MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH: `Details of which months the activity will happen and why must be ${MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH} characters or less`
}
