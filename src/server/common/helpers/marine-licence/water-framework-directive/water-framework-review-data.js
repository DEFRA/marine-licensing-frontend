export const NAUTICAL_MILE_HEADING =
  'Project located within one nautical mile (1.85km) of low-water, in a tidal river or estuary'

export const EXCLUDED_ACTIVITIES_HEADING =
  'Project limited to one of the excluded activities'

export const FILE_UPLOAD_HEADING = 'Water Framework Directive assessment upload'

const EXCLUDED_DISPLAY_KEYS = new Set(['s3Location'])

const getHeading = (property) => {
  switch (property) {
    case 'nauticalMile':
      return NAUTICAL_MILE_HEADING
    case 'excludedActivities':
      return EXCLUDED_ACTIVITIES_HEADING
    case 'uploadedFile':
      return FILE_UPLOAD_HEADING
    default:
      return undefined
  }
}

const getDisplayValue = (key, value) => {
  if (value === 'yes') {
    return 'Yes'
  }

  if (value === 'no') {
    return 'No'
  }

  if (key === 'uploadedFile') {
    const { filename } = value
    return filename
  }

  return undefined
}

export const waterFrameworkReviewData = (waterFrameworkDirective) => {
  if (!waterFrameworkDirective) {
    return {}
  }

  return Object.entries(waterFrameworkDirective)
    .filter(([key]) => !EXCLUDED_DISPLAY_KEYS.has(key))
    .reduce((acc, [key, value]) => {
      acc[key] = {
        key: { text: getHeading(key) },
        value: { text: getDisplayValue(key, value) }
      }
      return acc
    }, {})
}
