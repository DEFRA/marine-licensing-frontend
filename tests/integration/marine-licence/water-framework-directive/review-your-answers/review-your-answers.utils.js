import {
  EXCLUDED_ACTIVITIES_HEADING,
  NAUTICAL_MILE_HEADING
} from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'

export const getRowByKey = (summary, keyText) => {
  const rows = summary.querySelectorAll('.govuk-summary-list__row')

  return Array.from(rows).find((row) => {
    const keyElement = row.querySelector('.govuk-summary-list__key')
    return keyElement && keyElement.textContent.trim() === keyText
  })
}

export const validateWaterFrameworkDirectiveSummary = (
  document,
  expectedPageContent
) => {
  const waterFrameworkDirectiveSummary = document.querySelector(
    '#water-framework-directive-review'
  )
  expect(waterFrameworkDirectiveSummary).toBeTruthy()

  const nauticalMileRow = getRowByKey(
    waterFrameworkDirectiveSummary,
    NAUTICAL_MILE_HEADING
  )
  expect(nauticalMileRow.textContent).toContain(
    expectedPageContent.nauticalMile
  )

  const excludedActivitiesRow = getRowByKey(
    waterFrameworkDirectiveSummary,
    EXCLUDED_ACTIVITIES_HEADING
  )
  expect(excludedActivitiesRow.textContent).toContain(
    expectedPageContent.excludedActivities
  )
}
