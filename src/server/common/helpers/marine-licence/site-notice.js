import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const findSiteNoticeTask = (marineLicence) =>
  (marineLicence?.applicationTasks ?? []).find(
    (task) => task.type === APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE
  )

const hasInvalidEvidenceNumber = (evidenceNumber, evidenceItems) => {
  const editingExistingEvidence = evidenceNumber <= evidenceItems.length
  const addingNewEvidence = evidenceNumber === evidenceItems.length + 1

  return !editingExistingEvidence && !addingNewEvidence
}

export const validateEvidenceParam = {
  method(request, h) {
    const evidenceNumber = Number.parseInt(request.query.evidence, 10)
    const evidenceItems = []

    if (hasInvalidEvidenceNumber(evidenceNumber, evidenceItems)) {
      return h
        .redirect(
          `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${request.params.marineLicenceId}`
        )
        .takeover()
    }

    return h.continue
  }
}
