import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { routes } from '#src/server/common/constants/routes.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import escapeHtml from 'lodash/escape.js'

export const sortProjectsByStatus = (projects) => {
  return [...projects].sort((a, b) => {
    const statusA = a.status ?? ''
    const statusB = b.status ?? ''
    return statusB.localeCompare(statusA)
  })
}

export const getActionButtons = (project) => {
  const isOwnProject = project.isOwnProject ?? true
  const escapedProjectName = escapeHtml(project.projectName)

  if (isOwnProject) {
    if (project.status === 'Draft') {
      return `<a href="${routes.TASK_LIST}/${project.id}" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="${routes.DELETE_EXEMPTION}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="Delete ${escapedProjectName}">Delete</a>`
    }
    return `<a href="${routes.VIEW_DETAILS}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`
  }

  if (project.status === 'Draft') {
    return ''
  }
  return `<a href="${routes.VIEW_DETAILS}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`
}

export const formatProjectsForDisplay = (projects, isEmployee = false) =>
  projects.map((project) => {
    const tagClass =
      project.status === 'Draft' ? 'govuk-tag--light-blue' : 'govuk-tag--green'

    const isOwnProject = project.isOwnProject ?? true

    const baseRow = [
      { text: project.projectName },
      { text: EXEMPTION_TYPE },
      { text: project.applicationReference || '-' },
      {
        html: `<strong class="govuk-tag ${tagClass}">${escapeHtml(project.status)}</strong>`
      },
      {
        text: project.submittedAt
          ? formatDate(project.submittedAt, 'd MMM yyyy')
          : '-',
        attributes: {
          'data-sort-value': project.submittedAt ?? 0
        }
      }
    ]

    if (isEmployee) {
      baseRow.push({ text: project.ownerName || '-' })
    }

    baseRow.push({ html: getActionButtons(project) })

    return {
      cells: baseRow,
      attributes: {
        'data-is-own-project': isOwnProject ? 'true' : 'false'
      }
    }
  })
