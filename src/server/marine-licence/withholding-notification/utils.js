import {
  WITHHOLDING_DECISION_TEXT,
  WITHHOLDING_SECTION_HEADINGS
} from '#src/server/marine-licence/withholding-notification/constants.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

const BASIS_KEYS = Object.keys(WITHHOLDING_SECTION_HEADINGS)

export const findWithholdingTask = (marineLicence) =>
  (marineLicence?.applicationTasks ?? []).find(
    (task) => task.type === APPLICATION_TASK_TYPE.WITHHOLDING_NOTIFICATION
  )

const buildParagraphs = (comments) =>
  (comments ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

// A basis is absent from the task data unless the caseworker flagged redaction on it,
// which is what keeps the section off the page entirely.
export const buildWithholdingSections = (task) =>
  BASIS_KEYS.filter((key) => task?.data?.[key]).map((key) => {
    const { withheldSome, comments } = task.data[key]

    return {
      heading: WITHHOLDING_SECTION_HEADINGS[key],
      decision: withheldSome
        ? WITHHOLDING_DECISION_TEXT.withheld
        : WITHHOLDING_DECISION_TEXT.notWithheld,
      paragraphs: buildParagraphs(comments)
    }
  })
