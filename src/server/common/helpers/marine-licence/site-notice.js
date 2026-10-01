import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

export const findSiteNoticeTask = (marineLicence) =>
  (marineLicence?.applicationTasks ?? []).find(
    (task) => task.type === APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE
  )
