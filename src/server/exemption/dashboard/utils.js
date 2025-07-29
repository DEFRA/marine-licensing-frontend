import { formatDate } from '~/src/config/nunjucks/filters/format-date.js'
import { routes } from '~/src/server/common/constants/routes.js'

export const getActionButtons = (project) => {
  let buttons = ''

  if (project.status === 'Draft') {
    buttons = `<a href="${routes.TASK_LIST}/${project.id}" class="govuk-link" aria-label="Continue to task list">Continue</a>`
  }

  return buttons
}

export const formatProjectsForDisplay = (projects) =>
  projects.map((project) => {
    const tagClass =
      project.status === 'Draft' ? 'govuk-tag--light-blue' : 'govuk-tag--green'

    return [
      { text: project.projectName },
      { text: project.type },
      { text: project.applicationReference || '-' },
      {
        html: `<strong class="govuk-tag ${tagClass}">${project.status}</strong>`
      },
      {
        text: project.submittedAt
          ? formatDate(project.submittedAt, 'd MMM yyyy')
          : '-'
      },
      { html: getActionButtons(project) }
    ]
  })
