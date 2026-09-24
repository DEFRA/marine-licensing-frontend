import nunjucks from 'nunjucks'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'

const publishedText = (redaction, value) =>
  redaction && 'redactedText' in redaction
    ? new nunjucks.runtime.SafeString(wrapRedactionLabels(redaction.redactedText))
    : value

const publishedActivity = (activity, redactions = {}) => ({
  ...activity,
  activitySubType: publishedText(
    redactions.activitySubType,
    activity.activitySubType
  ),
  activityDescription: publishedText(
    redactions.activityDescription,
    activity.activityDescription
  ),
  activityDuration: publishedText(
    redactions.activityDuration,
    activity.activityDuration
  ),
  completionDate: publishedText(
    redactions.completionDate,
    activity.completionDate
  ),
  activityMonths: publishedText(
    redactions.activityMonths,
    activity.activityMonths
  ),
  workingHours: publishedText(
    redactions.workingHours,
    activity.workingHours
  ),
  activities:
    redactions.activities && 'redactedText' in redactions.activities
      ? [publishedText(redactions.activities, activity.activities)]
      : activity.activities
})

export const buildRedactedPreviewProjectDetails = (marineLicence) => {
  const redactions = marineLicence.redactions ?? {}

  return {
    projectName: publishedText(
      redactions.projectName,
      marineLicence.projectName
    ),
    projectBackground: publishedText(
      redactions.projectBackground,
      marineLicence.projectBackground
    ),
    preferredDates: publishedText(
      redactions.preferredDates,
      marineLicence.preferredDates
    )
  }
}

export const buildRedactedSiteDetails = (marineLicence) => {
  const siteRedactions = marineLicence.redactions?.siteDetails ?? {}
  const { coordinatesType, summaryData } = buildSiteData(marineLicence)

  return {
    coordinatesType,
    summaryData: summaryData.map((site, index) => ({
      ...site,
      siteName: publishedText(siteRedactions[index]?.siteName, site.siteName),
      width: publishedText(siteRedactions[index]?.circleWidth, site.width),
      activityDetails: site.activityDetails?.map((activity, activityIndex) =>
        publishedActivity(
          activity,
          siteRedactions[index]?.activityDetails?.[activityIndex]
        )
      )
    }))
  }
}
