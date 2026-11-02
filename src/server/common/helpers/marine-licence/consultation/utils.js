import { CONSULTATION_STATUS_CODE } from '#src/server/common/constants/marine-licence.js'

export const hasResponded = (consultation) =>
  consultation.consultationStatus === CONSULTATION_STATUS_CODE.RESPONDED
