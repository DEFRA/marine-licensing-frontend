import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { validateMarineLicenceIdParams } from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'
import { getViewDetailsUrl } from '#src/server/common/helpers/view-details/utils.js'
import {
  findSiteNoticeTask,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { handlePhotoUploadStatus } from '#src/server/marine-licence/site-notice/photo-upload-and-wait/upload-status.js'
import {
  siteNoticeDisplayUrl,
  siteNoticeLocationUrl
} from '#src/server/marine-licence/site-notice/utils.js'

const saveSiteNoticeEvidencePhoto = (request, field, photo) =>
  authenticatedPatchRequest(request, apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE, {
    [field]: photo,
    id: request.params.marineLicenceId,
    evidenceIndex: Number.parseInt(request.query.location, 10) - 1
  })

export const siteNoticePhotoUploadAndWaitController = {
  options: {
    ...validateMarineLicenceIdParams,
    pre: [validateEvidenceParam]
  },
  handler(request, h) {
    const { marineLicenceId } = request.params
    const marineLicence = request.marineLicence

    if (!findSiteNoticeTask(marineLicence)) {
      return h.redirect(getViewDetailsUrl(marineLicenceId))
    }

    return handlePhotoUploadStatus(request, h, {
      marineLicence,
      persistPhoto: saveSiteNoticeEvidencePhoto,
      returnUrl: siteNoticeLocationUrl(request),
      noUploadUrl: siteNoticeDisplayUrl(marineLicenceId)
    })
  }
}
