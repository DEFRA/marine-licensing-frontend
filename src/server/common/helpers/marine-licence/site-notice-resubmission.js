import joi from 'joi'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import {
  getLocationIndex,
  loadMarineLicence
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { marineLicenceIdSchema } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'

const TASK_ID_LENGTH = 24

export const validateResubmissionParams = {
  validate: {
    params: joi.object({
      marineLicenceId: marineLicenceIdSchema,
      taskId: joi.string().hex().length(TASK_ID_LENGTH).required()
    })
  }
}

export const resubmissionUrl = (marineLicenceId, taskId) =>
  `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${taskId}`

export const resubmissionPhotoUrl = (route, request) => {
  const { marineLicenceId, taskId } = request.params
  return `${route}/${marineLicenceId}/${taskId}?location=${request.query.location}`
}

const findResubmissionTask = (marineLicence, taskId) =>
  (marineLicence?.applicationTasks ?? []).find(
    (task) =>
      task.type === APPLICATION_TASK_TYPE.RESUBMIT_SITE_NOTICE_EVIDENCE &&
      task.taskId === taskId
  )

export const isResubmissionComplete = (locations) =>
  locations.every(
    ({ closeUpPhoto, positionPhoto }) => closeUpPhoto && positionPhoto
  )

export const loadResubmissionTask = {
  method: async (request, h) => {
    const { marineLicence, marineLicenceId } = await loadMarineLicence(request)
    const task = findResubmissionTask(marineLicence, request.params.taskId)

    if (!task) {
      return h.redirect(getViewDetailsUrl(marineLicenceId)).takeover()
    }

    request.marineLicence = marineLicence
    request.resubmissionTask = task

    return h.continue
  }
}

export const validateResubmissionLocation = {
  method: (request, h) => {
    const task = request.resubmissionTask
    const locationNumber = getLocationIndex(request)
    const isRejectedLocation = task.data.locations.some(
      (location) => location.locationNumber === locationNumber
    )

    if (task.resolvedAt || !isRejectedLocation) {
      return h
        .redirect(resubmissionUrl(request.params.marineLicenceId, task.taskId))
        .takeover()
    }

    return h.continue
  }
}
