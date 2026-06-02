import {
  mapCountRecordToSortedEntries,
  mapCountRecordToTableRows,
  mapExemptionStats,
  mapSummaryReport
} from './utils.js'

describe('mapSummaryReport', () => {
  test('maps status counts from API payload', () => {
    expect(
      mapSummaryReport({
        submittedExemptions: 12,
        unsubmittedExemptions: 7,
        withdrawnExemptions: 2
      })
    ).toEqual({
      submittedExemptions: 12,
      unsubmittedExemptions: 7,
      withdrawnExemptions: 2
    })
  })

  test('defaults missing values to zero', () => {
    expect(mapSummaryReport()).toEqual({
      submittedExemptions: 0,
      unsubmittedExemptions: 0,
      withdrawnExemptions: 0
    })
  })
})

describe('mapCountRecordToSortedEntries', () => {
  test('sorts by count descending then label alphabetically', () => {
    expect(
      mapCountRecordToSortedEntries({
        25: 2,
        17: 1,
        34: 2
      })
    ).toEqual([
      { label: '25', count: 2 },
      { label: '34', count: 2 },
      { label: '17', count: 1 }
    ])
  })

  test('returns empty array when record is missing', () => {
    expect(mapCountRecordToSortedEntries()).toEqual([])
  })
})

describe('mapCountRecordToTableRows', () => {
  test('maps sorted entries to govuk table rows', () => {
    expect(mapCountRecordToTableRows({ East: 2, South: 1 })).toEqual([
      [{ text: 'East' }, { text: '2' }],
      [{ text: 'South' }, { text: '1' }]
    ])
  })
})

describe('mapExemptionStats', () => {
  test('maps full API payload to view model', () => {
    expect(
      mapExemptionStats({
        coordinatesInputMethod: {
          shapefile: 1,
          kml: 2,
          manualCoordinates: 3
        },
        coordinateSystemVolume: {
          wgs84: { count: 3, percentage: 75 },
          bng: { count: 1, percentage: 25 },
          total: 4
        },
        byArticle: { 25: 2, 17: 1 },
        byMarinePlanArea: { 'East inshore': 2 },
        byCoastalOperationsArea: { South: 1 }
      })
    ).toEqual({
      coordinatesInputMethod: {
        shapefile: 1,
        kml: 2,
        manualCoordinates: 3
      },
      coordinateSystemVolume: {
        wgs84: { count: 3, percentage: '75%' },
        bng: { count: 1, percentage: '25%' },
        total: 4
      },
      byArticleRows: [
        [{ text: '25' }, { text: '2' }],
        [{ text: '17' }, { text: '1' }]
      ],
      byMarinePlanAreaRows: [[{ text: 'East inshore' }, { text: '2' }]],
      byCoastalOperationsAreaRows: [[{ text: 'South' }, { text: '1' }]]
    })
  })

  test('defaults missing values to zero and empty tables', () => {
    expect(mapExemptionStats()).toEqual({
      coordinatesInputMethod: {
        shapefile: 0,
        kml: 0,
        manualCoordinates: 0
      },
      coordinateSystemVolume: {
        wgs84: { count: 0, percentage: '0%' },
        bng: { count: 0, percentage: '0%' },
        total: 0
      },
      byArticleRows: [],
      byMarinePlanAreaRows: [],
      byCoastalOperationsAreaRows: []
    })
  })
})
