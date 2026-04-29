const completionDateHeading =
  'Does any part of the activity need to be completed by a certain date?'

export const completionDateSettings = {
  pageTitle: completionDateHeading,
  heading: completionDateHeading
}

export const COMPLETION_DATE_REASON_MAX_LENGTH = 1000

export const completionDateErrorMessages = {
  COMPLETION_DATE_REQUIRED:
    'Select whether any part of the project needs to be completed by a certain date',
  COMPLETION_DATE_REASON_REQUIRED: 'Provide reasons for the completion date',
  COMPLETION_DATE_REASON_MAX_LENGTH: `Reasons for the completion date must be ${COMPLETION_DATE_REASON_MAX_LENGTH} characters or less`
}
