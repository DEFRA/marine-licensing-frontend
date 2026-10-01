import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { assertIsOriginalSubmitter } from '#src/server/common/helpers/view-details/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getLocationIndex = (request) =>
  Number.parseInt(request.query.evidence, 10)

export const loadMarineLicence = async (request) => {
  const { marineLicenceId } = request.params
  const service = getMarineLicenceService(request)
  const marineLicence = await service.getMarineLicenceById(marineLicenceId)

  await assertIsOriginalSubmitter(request, marineLicence)

  return { marineLicence, marineLicenceId }
}

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
