const formatPercentage = (percentage) => `${percentage}%`

/**
 * @param {Record<string, number>} [record]
 * @returns {{ label: string, count: number }[]}
 */
export const mapCountRecordToSortedEntries = (record = {}) =>
  Object.entries(record)
    .map(([label, count]) => ({ label: String(label), count }))
    .sort(
      (first, second) =>
        second.count - first.count || first.label.localeCompare(second.label)
    )

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
