import { getResubmissionLocations } from '#src/server/marine-licence/site-notice/resubmit/utils.js'
import {
  mockMarineLicenceWithResubmissionTask,
  mockResubmittedMarineLicence
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

const resubmissionTask = (marineLicence) => marineLicence.applicationTasks[1]

describe('getResubmissionLocations', () => {
  test('returns only the rejected locations, ordered by location number', () => {
    const locations = getResubmissionLocations(
      mockMarineLicenceWithResubmissionTask,
      resubmissionTask(mockMarineLicenceWithResubmissionTask)
    )

    expect(locations.map(({ locationNumber }) => locationNumber)).toEqual([
      1, 3, 4
    ])
  })

  test('pairs each location with its original name and date and the caseworker reason', () => {
    const [first] = getResubmissionLocations(
      mockMarineLicenceWithResubmissionTask,
      resubmissionTask(mockMarineLicenceWithResubmissionTask)
    )

    expect(first).toEqual({
      locationNumber: 1,
      locationName: 'Dawlish notice board',
      dateDisplayed: '10 September 2026',
      reason:
        'The close-up photo is blurred, so we cannot read the text on the notice.',
      closeUpPhoto: undefined,
      positionPhoto: undefined
    })
  })

  test('returns the filenames of resubmitted photos', () => {
    const locations = getResubmissionLocations(
      mockResubmittedMarineLicence,
      resubmissionTask(mockResubmittedMarineLicence)
    )

    expect(locations[2]).toEqual(
      expect.objectContaining({
        locationNumber: 4,
        closeUpPhoto: 'close-up-4.jpg',
        positionPhoto: 'position-4.jpg'
      })
    )
  })

  test('still returns a location whose original evidence is missing', () => {
    const [first] = getResubmissionLocations(
      { ...mockMarineLicenceWithResubmissionTask, siteNoticeEvidence: [] },
      resubmissionTask(mockMarineLicenceWithResubmissionTask)
    )

    expect(first).toEqual(
      expect.objectContaining({
        locationNumber: 1,
        locationName: undefined,
        dateDisplayed: undefined
      })
    )
  })

  test('does not reorder the task data it was given', () => {
    const task = resubmissionTask(mockMarineLicenceWithResubmissionTask)
    const originalOrder = task.data.locations.map((l) => l.locationNumber)

    getResubmissionLocations(mockMarineLicenceWithResubmissionTask, task)

    expect(task.data.locations.map((l) => l.locationNumber)).toEqual(
      originalOrder
    )
  })
})
