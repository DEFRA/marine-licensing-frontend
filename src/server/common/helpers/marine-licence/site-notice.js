import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { assertIsOriginalSubmitter } from '#src/server/common/helpers/view-details/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getLocationIndex = (request) =>
  Number.parseInt(request.query.location, 10)

export const loadMarineLicence = async (request) => {
  const { marineLicenceId } = request.params
  const service = getMarineLicenceService(request)
  const marineLicence = await service.getMarineLicenceById(marineLicenceId)

  await assertIsOriginalSubmitter(request, marineLicence)

  return { marineLicence, marineLicenceId }
}

export const getSiteNoticeEvidence = (marineLicence, evidenceParam) => {
  const siteNoticeEvidence = marineLicence.siteNoticeEvidence ?? []
  const evidenceIndex = Number.parseInt(evidenceParam, 10) - 1
  const existingEvidence = siteNoticeEvidence[evidenceIndex]
  return existingEvidence || {}
}

export const findSiteNoticeTask = (marineLicence) =>
  (marineLicence?.applicationTasks ?? []).find(
    (task) => task.type === APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE
  )

const hasInvalidEvidenceNumber = (evidenceNumber, evidenceItems) =>
  !Number.isInteger(evidenceNumber) ||
  evidenceNumber < 1 ||
  evidenceNumber > evidenceItems.length

export const validateEvidenceParam = {
  method: async (request, h) => {
    const { marineLicence } = await loadMarineLicence(request)
    request.marineLicence = marineLicence

    const evidenceNumber = Number.parseInt(request.query.location, 10)

    if (
      hasInvalidEvidenceNumber(
        evidenceNumber,
        marineLicence.siteNoticeEvidence ?? []
      )
    ) {
      return h
        .redirect(
          `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${request.params.marineLicenceId}`
        )
        .takeover()
    }

    return h.continue
  }
}
