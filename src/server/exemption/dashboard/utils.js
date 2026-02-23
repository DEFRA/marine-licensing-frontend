import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  EXEMPTION_TYPE,
  EXEMPTION_STATUS
} from '#src/server/common/constants/exemptions.js'
import { getTagStyle } from '#src/server/common/helpers/exemptions/get-tag-style.js'
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

  const { status, id, projectName } = project

  const escapedProjectName = escapeHtml(projectName)

  const canWithdraw = status === EXEMPTION_STATUS.ACTIVE && !!isOwnProject

  if (isOwnProject) {
    if (status === EXEMPTION_STATUS.DRAFT) {
      return `<a href="${routes.TASK_LIST}/${id}" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="${routes.DELETE_EXEMPTION}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Delete ${escapedProjectName}">Delete</a>`
    }
    const marginClass = canWithdraw
      ? 'govuk-link govuk-!-margin-right-4 '
      : 'govuk-link '

    let buttons = `<a href="${routes.VIEW_DETAILS}/${id}" class="${marginClass}govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`

    if (canWithdraw) {
      buttons += `<a href="${routes.WITHDRAW_EXEMPTION}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Withdraw ${escapedProjectName}">Withdraw</a>`
    }
    return buttons
  }

  if (project.status === EXEMPTION_STATUS.DRAFT) {
    return ''
  }
  return `<a href="${routes.VIEW_DETAILS}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`
}

export const formatProjectsForDisplay = (projects, isEmployee = false) =>
  projects.map((project) => {
    const { status } = project

    const isOwnProject = project.isOwnProject ?? true

    const baseRow = [
      { text: project.projectName },
      { text: EXEMPTION_TYPE },
      { text: project.applicationReference || '-' },
      {
        html: `<strong class="govuk-tag ${getTagStyle(status)}">${escapeHtml(project.status)}</strong>`
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
