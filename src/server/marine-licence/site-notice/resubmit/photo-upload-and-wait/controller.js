import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getLocationIndex } from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  loadResubmissionTask,
  resubmissionUrl,
  validateResubmissionLocation,
  validateResubmissionParams
} from '#src/server/common/helpers/marine-licence/site-notice-resubmission.js'
import { handlePhotoUploadStatus } from '#src/server/marine-licence/site-notice/photo-upload-and-wait/upload-status.js'

const saveResubmissionPhoto = (request, field, photo) =>
  authenticatedPatchRequest(
    request,
    apiRoutes.UPDATE_SITE_NOTICE_RESUBMISSION,
    {
      id: request.params.marineLicenceId,
      taskId: request.params.taskId,
      locationNumber: getLocationIndex(request),
      [field]: photo
    }
  )

export const siteNoticeResubmitPhotoUploadAndWaitController = {
  options: {
    ...validateResubmissionParams,
    pre: [loadResubmissionTask, validateResubmissionLocation]
  },
  handler(request, h) {
    const { marineLicenceId, taskId } = request.params

    return handlePhotoUploadStatus(request, h, {
      marineLicence: request.marineLicence,
      persistPhoto: saveResubmissionPhoto,
      returnUrl: resubmissionUrl(marineLicenceId, taskId)
    })
  }
}
