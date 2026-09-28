export const PROJECT_STATUS = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
  SUBMITTED: 'Submitted',
  TRANSFERRED: 'Transferred',
  WITHDRAWN: 'Withdrawn',
  ACTION_REQUIRED: 'Action required'
}

// ACTION_REQUIRED sits on top of SUBMITTED while an application task is outstanding,
// so a licence awaiting the applicant can still be withdrawn.
export const WITHDRAWABLE_MARINE_LICENCE_STATUSES = [
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.ACTION_REQUIRED
]

// An exemption whose activity period has ended can no longer be withdrawn.
export const WITHDRAWABLE_EXEMPTION_STATUSES = [
  PROJECT_STATUS.SCHEDULED,
  PROJECT_STATUS.ACTIVE
]

export const UNABLE_TO_PROGRESS = 'Unable to progress'

export const PROJECT_TYPE = {
  EXEMPTION: 'exemption',
  MARINE_LICENCE: 'marine-licence'
}
