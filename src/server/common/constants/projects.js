export const PROJECT_STATUS = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
  SUBMITTED: 'Submitted',
  TRANSFERRED: 'Transferred',
  WITHDRAWN: 'Withdrawn'
}

// Derived by the API from an outstanding application task and carried alongside
// `status`, which is always the lifecycle status. Deliberately outside PROJECT_STATUS:
// it is a label to render, not a status an application can be in.
export const DISPLAY_STATUS = {
  ACTION_REQUIRED: 'Action required'
}

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
