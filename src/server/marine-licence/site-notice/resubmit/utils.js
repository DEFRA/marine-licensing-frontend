import { getSiteNoticeValues } from '#src/server/marine-licence/site-notice/display/utils.js'

const byLocationNumber = (a, b) => a.locationNumber - b.locationNumber

export const getResubmissionLocations = (marineLicence, task) => {
  const originalEvidence = getSiteNoticeValues(marineLicence)

  return [...task.data.locations]
    .sort(byLocationNumber)
    .map(({ locationNumber, reason, closeUpPhoto, positionPhoto }) => {
      const original = originalEvidence[locationNumber - 1] ?? {}

      return {
        locationNumber,
        locationName: original.locationName,
        dateDisplayed: original.dateDisplayed,
        reason,
        closeUpPhoto: closeUpPhoto?.uploadedFile.filename,
        positionPhoto: positionPhoto?.uploadedFile.filename
      }
    })
}
