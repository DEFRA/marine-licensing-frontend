import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

export function isProjectViewable(project) {
  return (
    project.status !== PROJECT_STATUS.DRAFT && !!project.applicationReference
  )
}
