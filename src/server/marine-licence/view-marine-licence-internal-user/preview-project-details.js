import nunjucks from 'nunjucks'
import { buildSiteData } from '#src/server/common/helpers/marine-licence/site-data.js'
import { buildMarinePlanPoliciesData } from '#src/server/common/helpers/marine-licence/marine-plan-policies-data.js'
import { waterFrameworkReviewData } from '#src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { wrapRedactionLabels } from '#src/server/common/helpers/marine-licence/redaction-label.js'

const publishedText = (redaction, value) =>
  redaction && 'redactedText' in redaction
    ? new nunjucks.runtime.SafeString(
        wrapRedactionLabels(redaction.redactedText)
      )
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
  workingHours: publishedText(redactions.workingHours, activity.workingHours),
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

export const buildRedactedOtherPermissions = (marineLicence) => {
  const redactions = marineLicence.redactions ?? {}

  return {
    specialLegalPowers:
      redactions.specialLegalPowers &&
      'redactedText' in redactions.specialLegalPowers
        ? {
            ...marineLicence.specialLegalPowers,
            agree: 'yes',
            details: publishedText(
              redactions.specialLegalPowers,
              marineLicence.specialLegalPowers?.details
            )
          }
        : marineLicence.specialLegalPowers,
    harbourAuthority:
      redactions.harbourAuthority &&
      'redactedText' in redactions.harbourAuthority
        ? {
            ...marineLicence.harbourAuthority,
            area: 'yes',
            details: publishedText(
              redactions.harbourAuthority,
              marineLicence.harbourAuthority?.details
            )
          }
        : marineLicence.harbourAuthority,
    otherAuthorities:
      redactions.otherAuthorities &&
      'redactedText' in redactions.otherAuthorities
        ? {
            ...marineLicence.otherAuthorities,
            agree: 'yes',
            details: publishedText(
              redactions.otherAuthorities,
              marineLicence.otherAuthorities?.details
            )
          }
        : marineLicence.otherAuthorities,
    publicConsultation:
      redactions.publicConsultation &&
      'redactedText' in redactions.publicConsultation
        ? {
            ...marineLicence.publicConsultation,
            consulted: 'yes',
            details: publishedText(
              redactions.publicConsultation,
              marineLicence.publicConsultation?.details
            )
          }
        : marineLicence.publicConsultation
  }
}

export const buildRedactedMarinePlanPolicies = (marineLicence) => {
  const responses = marineLicence.redactions?.marinePlanPolicyResponses ?? {}

  return buildMarinePlanPoliciesData(marineLicence).map((policy) => ({
    ...policy,
    response: publishedText(responses[policy.policyCode], policy.response)
  }))
}

export const buildRedactedWaterFrameworkDirectiveData = (marineLicence) => {
  const data = waterFrameworkReviewData(marineLicence.waterFrameworkDirective)
  const redactions = marineLicence.redactions?.waterFrameworkDirective ?? {}

  return {
    ...data,
    ...(data.nauticalMile && {
      nauticalMile: {
        ...data.nauticalMile,
        value: {
          text: publishedText(
            redactions.nauticalMile,
            data.nauticalMile.value.text
          )
        }
      }
    }),
    ...(data.excludedActivities && {
      excludedActivities: {
        ...data.excludedActivities,
        value: {
          text: publishedText(
            redactions.excludedActivities,
            data.excludedActivities.value.text
          )
        }
      }
    })
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
