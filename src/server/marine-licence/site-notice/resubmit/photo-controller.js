import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getLocationIndex } from '#src/server/common/helpers/marine-licence/site-notice.js'
import {
  loadResubmissionTask,
  resubmissionPhotoUrl,
  resubmissionUrl,
  validateResubmissionLocation,
  validateResubmissionParams
} from '#src/server/common/helpers/marine-licence/site-notice-resubmission.js'
import {
  SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
  siteNoticeCloseUpPhotoSettings
} from '#src/server/marine-licence/site-notice/close-up-photo/controller.js'
import {
  SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
  siteNoticePositionPhotoSettings
} from '#src/server/marine-licence/site-notice/position-photo/controller.js'
import { handlePhotoUploadStatus } from '#src/server/marine-licence/site-notice/photo-upload-and-wait/upload-status.js'
import {
  getPhotoUploadErrorDisplay,
  initiatePhotoUpload,
  PHOTO_ACCEPT_ATTRIBUTE
} from '#src/server/marine-licence/site-notice/utils.js'

const resubmissionOptions = {
  ...validateResubmissionParams,
  pre: [loadResubmissionTask, validateResubmissionLocation]
}

const taskUrl = (request) =>
  resubmissionUrl(request.params.marineLicenceId, request.params.taskId)

const createResubmissionPhotoController = ({
  field,
  route,
  viewRoute,
  settings
}) => ({
  options: resubmissionOptions,
  async handler(request, h) {
    const locationNumber = getLocationIndex(request)
    const { errorSummary, errors } = getPhotoUploadErrorDisplay(request)

    try {
      const uploadConfig = await initiatePhotoUpload(request, h, {
        field,
        uploadPageUrl: resubmissionPhotoUrl(route, request),
        redirectUrl: resubmissionPhotoUrl(
          marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT,
          request
        )
      })

      return h.view(viewRoute, {
        ...settings,
        projectName: request.marineLicence.projectName,
        locationIndex: locationNumber,
        uploadUrl: uploadConfig.uploadUrl,
        acceptAttribute: PHOTO_ACCEPT_ATTRIBUTE,
        backLink: `${taskUrl(request)}#site-location-${locationNumber}`,
        errorSummary,
        errors
      })
    } catch (error) {
      request.logger.error(
        { err: error },
        `Failed to initialise site notice resubmission ${field} upload`
      )
      return h.redirect(taskUrl(request))
    }
  }
})

export const siteNoticeResubmitCloseUpPhotoController =
  createResubmissionPhotoController({
    field: 'closeUpPhoto',
    route:
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO,
    viewRoute: SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
    settings: siteNoticeCloseUpPhotoSettings
  })

export const siteNoticeResubmitPositionPhotoController =
  createResubmissionPhotoController({
    field: 'positionPhoto',
    route:
      marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO,
    viewRoute: SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
    settings: siteNoticePositionPhotoSettings
  })

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
  options: resubmissionOptions,
  handler(request, h) {
    return handlePhotoUploadStatus(request, h, {
      marineLicence: request.marineLicence,
      persistPhoto: saveResubmissionPhoto,
      returnUrl: taskUrl(request)
    })
  }
}
