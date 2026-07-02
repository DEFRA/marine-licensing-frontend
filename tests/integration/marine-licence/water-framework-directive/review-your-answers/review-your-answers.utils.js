import {
  EXCLUDED_ACTIVITIES_HEADING,
  FILE_UPLOAD_HEADING,
  NAUTICAL_MILE_HEADING
} from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { validateActionLink } from '#tests/integration/review-site-details/review-site-details-utils.js'

export const getRowByKey = (summary, keyText) => {
  const rows = summary.querySelectorAll('.govuk-summary-list__row')

  return Array.from(rows).find((row) => {
    const keyElement = row.querySelector('.govuk-summary-list__key')
    return keyElement && keyElement.textContent.trim() === keyText
  })
}

export const validateWaterFrameworkDirectiveSummaryForAllFields = (
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

  validateActionLink(nauticalMileRow, expectedPageContent.nauticalMile)

  const excludedActivitiesRow = getRowByKey(
    waterFrameworkDirectiveSummary,
    EXCLUDED_ACTIVITIES_HEADING
  )
  expect(excludedActivitiesRow.textContent).toContain(
    expectedPageContent.excludedActivities
  )

  validateActionLink(
    excludedActivitiesRow,
    expectedPageContent.excludedActivities
  )

  const fileUploadRow = getRowByKey(
    waterFrameworkDirectiveSummary,
    FILE_UPLOAD_HEADING
  )
  expect(fileUploadRow.textContent).toContain(expectedPageContent.fileUpload)

  validateActionLink(fileUploadRow, expectedPageContent.fileUpload)
}

export const validateWaterFrameworkDirectiveSummaryForMinimumFields = (
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

  validateActionLink(nauticalMileRow, expectedPageContent.nauticalMile)

  const excludedActivitiesRow = getRowByKey(
    waterFrameworkDirectiveSummary,
    EXCLUDED_ACTIVITIES_HEADING
  )

  expect(excludedActivitiesRow.textContent).toContain(
    expectedPageContent.excludedActivities
  )

  validateActionLink(
    excludedActivitiesRow,
    expectedPageContent.excludedActivities
  )

  const rows = waterFrameworkDirectiveSummary.querySelectorAll(
    '.govuk-summary-list__row'
  )

  expect(rows.length).toBe(2)
}
