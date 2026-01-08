import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { routes } from '#src/server/common/constants/routes.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'

export const sortProjectsByStatus = (projects) => {
  return [...projects].sort((a, b) => {
    const statusA = a.status ?? ''
    const statusB = b.status ?? ''
    return statusB.localeCompare(statusA)
  })
}

export const getActionButtons = (project) => {
  let buttons = ''

  if (project.status === 'Draft') {
    buttons = `<a href="${routes.TASK_LIST}/${project.id}" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a>`
    buttons += `<a href="${routes.DELETE_EXEMPTION}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="Delete ${project.projectName}">Delete</a>`
  } else {
    buttons = `<a href="${routes.VIEW_DETAILS}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${project.projectName}">View details</a>`
  }

  return buttons
}

export const formatProjectsForDisplay = (projects) =>
  projects.map((project) => {
    const tagClass =
      project.status === 'Draft' ? 'govuk-tag--light-blue' : 'govuk-tag--green'

    return [
      { text: project.projectName },
      { text: EXEMPTION_TYPE },
      { text: project.applicationReference || '-' },
      {
        html: `<strong class="govuk-tag ${tagClass}">${project.status}</strong>`
      },
      {
        text: project.submittedAt
          ? formatDate(project.submittedAt, 'd MMM yyyy')
          : '-',
        attributes: {
          'data-sort-value': project.submittedAt ?? 0
        }
      },
      { html: getActionButtons(project) }
    ]
  })
