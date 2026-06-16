export const NAUTICAL_MILE_HEADING =
  'Project located within one nautical mile (1.85km) of the coast'

export const EXCLUDED_ACTIVITIES_HEADING =
  'Project limited to one of the excluded activities'

export const PREVIOUS_ASSESSMENT_HEADING =
  'Previous 2015 to 2022 Water Framework Directive assessment'

export const ASSESSMENT_CHANGED_HEADING =
  'Changes since the previous Water Framework Directive assessment'

const getHeading = (property) => {
  switch (property) {
    case 'nauticalMile':
      return NAUTICAL_MILE_HEADING
    case 'excludedActivities':
      return EXCLUDED_ACTIVITIES_HEADING
    case 'previousAssessment':
      return PREVIOUS_ASSESSMENT_HEADING
    case 'assessmentChanged':
      return ASSESSMENT_CHANGED_HEADING
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

  return undefined
}

export const waterFrameworkReviewData = (waterFrameworkDirective) => {
  return Object.entries(waterFrameworkDirective).reduce((acc, [key, value]) => {
    acc[key] = {
      key: { text: getHeading(key) },
      value: { text: getDisplayValue(key, value) }
    }
    return acc
  }, {})
}
