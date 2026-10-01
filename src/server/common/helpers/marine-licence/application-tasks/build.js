import { applicationTaskRegistry } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

const byRegistryOrder = (a, b) => a.sortOrder - b.sortOrder

const buildTaskItem = (task, marineLicenceId) => {
  const definition = applicationTaskRegistry[task.type]

  if (!definition) {
    return null
  }

  const isResolved = Boolean(task.resolvedAt)

  return {
    title: { text: definition.title },
    href: definition.buildHref(marineLicenceId),
    status: isResolved
      ? { text: definition.resolvedLabel }
      : {
          tag: {
            text: definition.outstandingLabel,
            classes: 'govuk-tag--red'
          }
        },
    sortOrder: definition.sortOrder
  }
}

export const buildApplicationTasks = ({ marineLicence, currentContactId }) => {
  const isOriginalSubmitter =
    Boolean(currentContactId) && currentContactId === marineLicence?.contactId

  if (!isOriginalSubmitter) {
    return []
  }

  return (marineLicence?.applicationTasks ?? [])
    .map((task) => buildTaskItem(task, marineLicence.id))
    .filter(Boolean)
    .sort(byRegistryOrder)
}
