import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const APPLICATION_TASK_TYPE = {
  WITHHOLDING_NOTIFICATION: 'WITHHOLDING_NOTIFICATION'
}

// The extension point for later tickets: add an entry here plus a detail page, and
// the "Things that require your attention" section picks the task up unchanged.
export const applicationTaskRegistry = {
  [APPLICATION_TASK_TYPE.WITHHOLDING_NOTIFICATION]: {
    title: 'Notification about withholding information',
    buildHref: (marineLicenceId) =>
      `${marineLicenceRoutes.MARINE_LICENCE_WITHHOLDING_NOTIFICATION}/${marineLicenceId}`,
    outstandingLabel: 'Not yet read',
    resolvedLabel: 'Read'
  }
}
