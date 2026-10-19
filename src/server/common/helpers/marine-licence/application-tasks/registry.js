import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const APPLICATION_TASK_TYPE = {
  PUBLIC_SITE_NOTICE: 'PUBLIC_SITE_NOTICE',
  WITHHOLDING_NOTIFICATION: 'WITHHOLDING_NOTIFICATION',
  RESUBMIT_SITE_NOTICE_EVIDENCE: 'RESUBMIT_SITE_NOTICE_EVIDENCE'
}

export const applicationTaskRegistry = {
  [APPLICATION_TASK_TYPE.WITHHOLDING_NOTIFICATION]: {
    title: 'Notification about withholding information',
    buildHref: (marineLicenceId) =>
      `${marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION}/${marineLicenceId}`,
    outstandingLabel: 'Not yet read',
    resolvedLabel: 'Read',
    sortOrder: 1
  },
  [APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE]: {
    title: 'Display a site notice',
    buildHref: (marineLicenceId) =>
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`,
    outstandingLabel: 'Not yet responded',
    resolvedLabel: 'Completed',
    sortOrder: 2
  },
  [APPLICATION_TASK_TYPE.RESUBMIT_SITE_NOTICE_EVIDENCE]: {
    title: 'Resubmit site notice evidence',
    buildHref: (marineLicenceId, task) =>
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${task.taskId}`,
    outstandingLabel: 'Incomplete',
    resolvedLabel: 'Completed',
    sortOrder: 3
  }
}
