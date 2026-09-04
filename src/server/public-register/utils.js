import escapeHtml from 'lodash/escape.js'
import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { getApplicationTypeLabel } from '#src/server/common/helpers/public-register/get-application-type-label.js'
import { getPublicViewDetailsUrl } from '#src/server/common/helpers/public-register/get-public-view-details-url.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'

/**
 * @param {string} referenceNumber
 * @returns {{ year: number, sequence: number }}
 */
export const parseApplicationReference = (referenceNumber) => {
  const match = String(referenceNumber || '')
    .trim()
    .toUpperCase()
    .match(/^[A-Z]+\/(\d{4})\/(\d+)$/)

  if (!match) {
    return { year: 0, sequence: 0 }
  }

  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10)
  }
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @returns {Array<Record<string, unknown>>}
 */
export const sortByReferenceNewestFirst = (entries) =>
  [...entries].sort((entryA, entryB) => {
    const refA = parseApplicationReference(entryA.applicationReference)
    const refB = parseApplicationReference(entryB.applicationReference)

    if (refA.year !== refB.year) {
      return refB.year - refA.year
    }

    return refB.sequence - refA.sequence
  })

/**
 * @param {Record<string, unknown>} entry
 * @returns {string}
 */
const formatMarinePlanArea = (entry) => {
  if (entry.marinePlanArea) {
    return String(entry.marinePlanArea)
  }

  if (
    Array.isArray(entry.marinePlanAreas) &&
    entry.marinePlanAreas.length > 0
  ) {
    return entry.marinePlanAreas.join(', ')
  }

  return '-'
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @returns {Array<Array<{ text?: string, html?: string }>>}
 */
export const formatEntriesForDisplay = (entries) =>
  entries.map((entry) => {
    const projectName = entry.projectName ? String(entry.projectName) : '-'
    const status = entry.status ? String(entry.status) : 'Active'
    const viewUrl = getPublicViewDetailsUrl(
      String(entry.applicationType),
      String(entry.applicationId)
    )

    return [
      {
        text: entry.applicationReference
          ? String(entry.applicationReference)
          : '-'
      },
      { text: projectName },
      { text: getApplicationTypeLabel(String(entry.applicationType)) },
      { text: formatMarinePlanArea(entry) },
      {
        text: entry.dateSubmitted
          ? formatDate(String(entry.dateSubmitted), 'd MMM yyyy')
          : '-'
      },
      {
        html: `<strong class="govuk-tag ${getTagStyle(status)}">${escapeHtml(status)}</strong>`
      },
      {
        html: `<a class="govuk-link govuk-link--no-visited-state" href="${viewUrl}">View details<span class="govuk-visually-hidden"> of ${escapeHtml(projectName)}</span></a>`
      }
    ]
  })
