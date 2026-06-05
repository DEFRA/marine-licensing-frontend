/**
 * @param {number | string} percentage
 * @returns {string}
 */
export const formatPercentage = (percentage) => {
  const normalized = String(percentage).replace(/%$/, '').trim()
  const value = Number(normalized)
  const rounded = Number.isFinite(value) ? Math.round(value) : 0
  return `${rounded}%`
}

/**
 * @param {string} firstLabel
 * @param {string} secondLabel
 * @param {boolean} numericLabels
 */
const compareLabels = (firstLabel, secondLabel, numericLabels) =>
  numericLabels
    ? Number(firstLabel) - Number(secondLabel)
    : firstLabel.localeCompare(secondLabel)

/**
 * @param {Record<string, number>} record
 */
const usesNumericLabelSort = (record) =>
  Object.keys(record).every((label) => /^\d+$/.test(String(label)))

/**
 * @param {Record<string, number>} [record]
 * @returns {{ label: string, count: number }[]}
 */
export const mapCountRecordToSortedEntries = (record = {}) => {
  const numericLabels = usesNumericLabelSort(record)

  return Object.entries(record)
    .map(([label, count]) => ({ label: String(label), count }))
    .sort(
      (first, second) =>
        second.count - first.count ||
        compareLabels(first.label, second.label, numericLabels)
    )
}

/**
 * @param {Record<string, number>} [record]
 * @returns {{ text: string }[][]}
 */
export const mapCountRecordToTableRows = (record = {}) =>
  mapCountRecordToSortedEntries(record).map(({ label, count }) => [
    { text: label },
    { text: String(count) }
  ])

/**
 * @param {object} [value]
 */
export const mapExemptionStats = (value) => ({
  coordinatesInputMethod: {
    shapefile: value?.coordinatesInputMethod?.shapefile ?? 0,
    kml: value?.coordinatesInputMethod?.kml ?? 0,
    manualCoordinates: value?.coordinatesInputMethod?.manualCoordinates ?? 0
  },
  coordinateSystemVolume: {
    wgs84: {
      count: value?.coordinateSystemVolume?.wgs84?.count ?? 0,
      percentage: formatPercentage(
        value?.coordinateSystemVolume?.wgs84?.percentage ?? 0
      )
    },
    bng: {
      count: value?.coordinateSystemVolume?.bng?.count ?? 0,
      percentage: formatPercentage(
        value?.coordinateSystemVolume?.bng?.percentage ?? 0
      )
    },
    total: value?.coordinateSystemVolume?.total ?? 0
  },
  byArticleRows: mapCountRecordToTableRows(value?.byArticle),
  byMarinePlanAreaRows: mapCountRecordToTableRows(value?.byMarinePlanArea),
  byCoastalOperationsAreaRows: mapCountRecordToTableRows(
    value?.byCoastalOperationsArea
  )
})

/**
 * @param {object} [value]
 */
export const mapSummaryReport = (value) => ({
  submittedExemptions: value?.submittedExemptions ?? 0,
  unsubmittedExemptions: value?.unsubmittedExemptions ?? 0,
  withdrawnExemptions: value?.withdrawnExemptions ?? 0
})
