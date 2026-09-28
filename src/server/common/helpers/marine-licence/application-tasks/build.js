import { applicationTaskRegistry } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

const byReceivedAt = (a, b) =>
  new Date(a.receivedAt ?? 0) - new Date(b.receivedAt ?? 0)

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
        }
  }
}

export const buildApplicationTasks = ({ marineLicence, currentContactId }) => {
  const isOriginalSubmitter =
    Boolean(currentContactId) && currentContactId === marineLicence?.contactId

  if (!isOriginalSubmitter) {
    return []
  }

  const tasks = marineLicence?.applicationTasks ?? []

  const outstanding = tasks
    .filter((task) => !task.resolvedAt)
    .sort(byReceivedAt)
  const resolved = tasks.filter((task) => task.resolvedAt).sort(byReceivedAt)

  return [...outstanding, ...resolved]
    .map((task) => buildTaskItem(task, marineLicence.id))
    .filter(Boolean)
}
