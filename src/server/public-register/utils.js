import escapeHtml from 'lodash/escape.js'
import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getApplicationTypeLabel } from '#src/server/common/helpers/public-register/get-application-type-label.js'
import { getPublicViewDetailsUrl } from '#src/server/common/helpers/public-register/get-public-view-details-url.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'

const APPLICATION_REFERENCE_PATTERN = /^[A-Z]+\/(\d{4})\/(\d+)$/

/**
 * @param {unknown} value
 * @returns {string}
 */
const asDisplayString = (value) => {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

/**
 * @param {string} referenceNumber
 * @returns {{ year: number, sequence: number }}
 */
export const parseApplicationReference = (referenceNumber) => {
  const normalised = asDisplayString(referenceNumber).trim().toUpperCase()
  const match = APPLICATION_REFERENCE_PATTERN.exec(normalised)

  if (!match) {
    return { year: 0, sequence: 0 }
  }

  return {
    year: Number.parseInt(match[1], 10),
    sequence: Number.parseInt(match[2], 10)
  }
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @returns {Array<Record<string, unknown>>}
 */
export const sortByReferenceNewestFirst = (entries) =>
  entries
    .map((entry) => ({
      entry,
      ...parseApplicationReference(asDisplayString(entry.applicationReference))
    }))
    .sort((a, b) => b.year - a.year || b.sequence - a.sequence)
    .map(({ entry }) => entry)

/**
 * @param {Record<string, unknown>} entry
 * @returns {string}
 */
const formatMarinePlanArea = (entry) => {
  if (
    Array.isArray(entry.marinePlanAreas) &&
    entry.marinePlanAreas.length > 0
  ) {
    const areas = entry.marinePlanAreas
      .map(asDisplayString)
      .filter(Boolean)
      .join(', ')

    if (areas) {
      return areas
    }
  }

  return '-'
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @returns {Array<Array<{ text?: string, html?: string }>>}
 */
export const formatEntriesForDisplay = (entries) =>
  entries.map((entry) => {
    const projectName = asDisplayString(entry.projectName) || '-'
    const status = asDisplayString(entry.status) || 'Active'
    const applicationType = asDisplayString(entry.applicationType)
    const applicationId = asDisplayString(entry.applicationId)
    const applicationReference =
      asDisplayString(entry.applicationReference) || '-'
    const dateSubmitted = asDisplayString(entry.dateSubmitted)
    const viewUrl = getPublicViewDetailsUrl(applicationType, applicationId)

    return [
      { text: applicationReference },
      { text: projectName },
      { text: getApplicationTypeLabel(applicationType) },
      { text: formatMarinePlanArea(entry) },
      {
        text: dateSubmitted ? formatDate(dateSubmitted, 'd MMM yyyy') : '-'
      },
      {
        html: `<strong class="govuk-tag ${getTagStyle(status)}">${escapeHtml(status)}</strong>`
      },
      {
        html: `<a class="govuk-link govuk-link--no-visited-state" href="${viewUrl}">View details<span class="govuk-visually-hidden"> of ${escapeHtml(projectName)}</span></a>`
      }
    ]
  })
