import { MPP_UNLINK_PAYLOAD_KEY } from '#src/server/common/constants/cache.js'

export const setPendingUnlink = (request, pendingUnlink) => {
  request.yar.set(MPP_UNLINK_PAYLOAD_KEY, pendingUnlink)
}

export const clearPendingUnlink = (request) => {
  request.yar?.clear(MPP_UNLINK_PAYLOAD_KEY)
}

export const getPendingUnlink = (request, policyCode) => {
  const pendingUnlink = request.yar.get(MPP_UNLINK_PAYLOAD_KEY)
  return pendingUnlink?.body?.policyCode === policyCode ? pendingUnlink : null
}
