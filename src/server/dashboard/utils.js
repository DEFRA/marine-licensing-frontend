import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'
import { getTagStyle } from '#src/server/common/helpers/ui/get-tag-style.js'
import escapeHtml from 'lodash/escape.js'
import {
  MARINE_LICENCE_TYPE,
  MARINE_LICENCE_KEY
} from '#src/server/common/constants/marine-licence.js'

const getDraftActions = (id, escapedProjectName, projectType) => {
  const taskListRoute =
    projectType === MARINE_LICENCE_KEY
      ? marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      : routes.TASK_LIST

  const deleteRoute =
    projectType === MARINE_LICENCE_KEY
      ? marineLicenceRoutes.MARINE_LICENCE_DELETE
      : routes.DELETE_EXEMPTION

  return `<a href="${taskListRoute}/${id}" class="govuk-link govuk-!-margin-right-4 govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="${deleteRoute}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Delete ${escapedProjectName}">Delete</a>`
}

const getActiveActions = (id, escapedProjectName, canWithdraw) => {
  const marginClass = canWithdraw
    ? 'govuk-link govuk-!-margin-right-4 '
    : 'govuk-link '

  let buttons = `<a href="${routes.VIEW_DETAILS}/${id}" class="${marginClass}govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`

  if (canWithdraw) {
    buttons += `<a href="${routes.WITHDRAW_EXEMPTION}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Withdraw ${escapedProjectName}">Withdraw</a>`
  }
  return buttons
}

export const sortProjectsByStatus = (projects) => {
  return [...projects].sort((a, b) => {
    const statusA = a.status ?? ''
    const statusB = b.status ?? ''
    return statusB.localeCompare(statusA)
  })
}

export const getActionButtons = (project) => {
  const isOwnProject = project.isOwnProject ?? true

  const { status, id, projectName, projectType } = project

  const escapedProjectName = escapeHtml(projectName)

  if (projectType === MARINE_LICENCE_KEY) {
    return status === PROJECT_STATUS.DRAFT && isOwnProject
      ? getDraftActions(id, escapedProjectName, projectType)
      : ''
  }

  const canWithdraw = status === PROJECT_STATUS.ACTIVE && !!isOwnProject

  if (isOwnProject) {
    return status === PROJECT_STATUS.DRAFT
      ? getDraftActions(id, escapedProjectName, projectType)
      : getActiveActions(id, escapedProjectName, canWithdraw)
  }

  return project.status === PROJECT_STATUS.DRAFT
    ? ''
    : `<a href="${routes.VIEW_DETAILS}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`
}

export const formatProjectsForDisplay = (projects, isEmployee = false) =>
  projects.map((project) => {
    const { status, projectType } = project

    const isOwnProject = project.isOwnProject ?? true

    const baseRow = [
      { text: project.projectName },
      {
        text:
          projectType === MARINE_LICENCE_KEY
            ? MARINE_LICENCE_TYPE
            : EXEMPTION_TYPE
      },
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
