import { REDACTION_UPLOAD_KEY } from '#src/server/common/constants/cache.js'

/**
 * The replace-document journey keeps only the CDP handoff in session: to store the upload id and status
 */

export const setRedactionUpload = async (request, h, value) => {
  request.yar.set(REDACTION_UPLOAD_KEY, value)
  await request.yar.commit(h)
}

export const getRedactionUpload = (request) =>
  request.yar.get(REDACTION_UPLOAD_KEY) ?? {}

export const clearRedactionUpload = async (request, h) => {
  request.yar.clear(REDACTION_UPLOAD_KEY)
  await request.yar.commit(h)
}
