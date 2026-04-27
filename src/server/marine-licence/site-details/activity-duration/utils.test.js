import { remapDurationErrors } from '#src/server/marine-licence/site-details/activity-duration/utils.js'

describe('#remapDurationErrors', () => {
  test('collapses YEARS_REQUIRED and MONTHS_REQUIRED into DURATION_REQUIRED', () => {
    const result = remapDurationErrors([
      { message: 'YEARS_REQUIRED', path: ['activity-duration-years'] },
      { message: 'MONTHS_REQUIRED', path: ['activity-duration-months'] }
    ])

    expect(result).toEqual([
      {
        message: 'DURATION_REQUIRED',
        path: ['activity-duration-years'],
        hrefOverride: 'activity-duration-years',
        highlightMultipleFields: true
      }
    ])
  })

  test('remaps DURATION_BOTH_ZERO to years anchor and multi highlight', () => {
    const result = remapDurationErrors([
      { message: 'DURATION_BOTH_ZERO', path: ['activity-duration-months'] }
    ])

    expect(result).toEqual([
      {
        message: 'DURATION_BOTH_ZERO',
        path: ['activity-duration-years'],
        hrefOverride: 'activity-duration-years',
        highlightMultipleFields: true
      }
    ])
  })

  test('leaves unrelated errors untouched', () => {
    const details = [
      { message: 'MONTHS_NOT_VALID', path: ['activity-duration-months'] }
    ]
    const result = remapDurationErrors(details)
    expect(result).toEqual(details)
  })
})
