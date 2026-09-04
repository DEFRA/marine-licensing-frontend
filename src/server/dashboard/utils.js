import { formatDate } from '#src/config/nunjucks/filters/format-date.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import {
  routes,
  marineLicenceRoutes,
  apiRoutes
} from '#src/server/common/constants/routes.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import {
  PROJECT_STATUS,
  PROJECT_TYPE,
  UNABLE_TO_PROGRESS
} from '#src/server/common/constants/projects.js'
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

  return `<a href="${taskListRoute}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Continue to task list">Continue</a><a href="${deleteRoute}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Delete ${escapedProjectName}">Delete</a>`
}

const getViewDetailsRoute = (projectType, status) => {
  if (
    projectType === MARINE_LICENCE_KEY &&
    status === PROJECT_STATUS.TRANSFERRED
  ) {
    return marineLicenceRoutes.MARINE_LICENCE_APPLICATION_TRANSFERRED
  }

  if (
    projectType === MARINE_LICENCE_KEY &&
    status === PROJECT_STATUS.REJECTED
  ) {
    return marineLicenceRoutes.MARINE_LICENCE_APPLICATION_REJECTED
  }

  return projectType === MARINE_LICENCE_KEY
    ? marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS
    : routes.VIEW_DETAILS
}

const getActiveActions = (id, escapedProjectName, viewRoute, withdrawRoute) => {
  let buttons = `<a href="${viewRoute}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`

  if (withdrawRoute) {
    buttons += `<a href="${withdrawRoute}/${id}" class="govuk-link govuk-link--no-visited-state" aria-label="Withdraw ${escapedProjectName}">Withdraw</a>`
  }
  return buttons
}

const getMarineLicenceActions = ({
  id,
  escapedProjectName,
  viewRoute,
  status,
  isOwnProject
}) => {
  if (status === PROJECT_STATUS.DRAFT && isOwnProject) {
    return getDraftActions(id, escapedProjectName, MARINE_LICENCE_KEY)
  }

  const canWithdraw = status === PROJECT_STATUS.SUBMITTED && isOwnProject

  return getActiveActions(
    id,
    escapedProjectName,
    viewRoute,
    canWithdraw ? marineLicenceRoutes.MARINE_LICENCE_WITHDRAW : null
  )
}

const findMissingContactIds = (projects, users) => [
  ...new Set(
    projects
      .map((project) => project.contactId)
      .filter((contactId) => contactId && !(contactId in users))
  )
]

const resolveMissingUsers = async (request, missingContactIds) => {
  try {
    const { payload } = await authenticatedPostRequest(
      request,
      apiRoutes.GET_USER_NAMES,
      { contactIds: missingContactIds }
    )
    return payload?.value ?? {}
  } catch (error) {
    request.logger.error(
      { err: error },
      'Failed to resolve missing dashboard user names'
    )
    return {}
  }
}

export const fetchProjects = async (request, payload = {}) => {
  const userSession = await getUserSession(request, request.state?.userSession)
  const organisationId = userSession?.organisationId
  const cache = request.server?.app.dashboardUsersCache

  const cachedUsers = organisationId ? await cache.get(organisationId) : null
  const requestPayload = cachedUsers ? { ...payload, skipUsers: true } : payload

  const result = await authenticatedPostRequest(
    request,
    '/projects',
    requestPayload
  )

  const setCachedUsers = (usersToCache) =>
    organisationId ? cache.set(organisationId, usersToCache) : null

  let users = cachedUsers ?? result.payload?.value?.users ?? {}

  if (!cachedUsers) {
    await setCachedUsers(users)
    return result
  }

  const projects = result.payload?.value?.projects ?? []
  const missingContactIds = findMissingContactIds(projects, users)

  if (missingContactIds.length) {
    const resolvedUsers = await resolveMissingUsers(request, missingContactIds)

    if (Object.keys(resolvedUsers).length) {
      users = { ...users, ...resolvedUsers }
      await setCachedUsers(users)
    }
  }

  result.payload.value = {
    ...result.payload?.value,
    users
  }

  return result
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
  const viewRoute = getViewDetailsRoute(projectType, status)

  if (projectType === MARINE_LICENCE_KEY) {
    return getMarineLicenceActions({
      id,
      escapedProjectName,
      viewRoute,
      status,
      isOwnProject
    })
  }

  const canWithdraw = status === PROJECT_STATUS.ACTIVE && isOwnProject
  const withdrawRoute = canWithdraw ? routes.WITHDRAW_EXEMPTION : null

  if (isOwnProject) {
    return status === PROJECT_STATUS.DRAFT
      ? getDraftActions(id, escapedProjectName, projectType)
      : getActiveActions(id, escapedProjectName, viewRoute, withdrawRoute)
  }

  return project.status === PROJECT_STATUS.DRAFT
    ? ''
    : `<a href="${viewRoute}/${project.id}" class="govuk-link govuk-link--no-visited-state" aria-label="View details of ${escapedProjectName}">View details</a>`
}

export const getStatusLabelText = (status) => {
  if (status === PROJECT_STATUS.REJECTED) {
    return UNABLE_TO_PROGRESS
  }

  return escapeHtml(status)
}

export const formatProjectsForDisplay = (projects, isEmployee = false) =>
  projects.map((project) => {
    const { status, projectType } = project

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
        html: `<strong class="govuk-tag ${getTagStyle(status)}">${getStatusLabelText(project.status)}</strong>`,
        attributes: {
          'data-sort-value': project.status
        },
        classes: 'govuk-table__cell--nowrap'
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
      cells: baseRow
    }
  })

export const getFilterCategories = (searchParams) => {
  const categories = []

  if (!searchParams) {
    return categories
  }

  if (searchParams.status) {
    const { status } = searchParams

    const isMultipleSelected = Array.isArray(status)
    const transformedStatus = isMultipleSelected ? status : [status]

    categories.push({
      heading: {
        text: 'Status'
      },
      items: transformedStatus.map((categoryStatus) => ({
        href: '#',
        field: 'status',
        value: categoryStatus,
        text:
          categoryStatus === 'REJECTED'
            ? UNABLE_TO_PROGRESS
            : PROJECT_STATUS[categoryStatus]
      }))
    })
  }

  if (searchParams.type) {
    const { type } = searchParams

    const isMultipleSelected = Array.isArray(type)
    const transformedType = isMultipleSelected ? type : [type]

    categories.push({
      heading: {
        text: 'Submission type'
      },
      items: transformedType.map((categoryType) => ({
        href: '#',
        field: 'type',
        value: categoryType,
        text:
          categoryType === PROJECT_TYPE.EXEMPTION
            ? EXEMPTION_TYPE
            : MARINE_LICENCE_TYPE
      }))
    })
  }

  return categories
}

const MARINE_LICENCE_ONLY_STATUS_KEYS = new Set([
  'SUBMITTED',
  'TRANSFERRED',
  'REJECTED',
  'WITHDRAWN'
])

export const getStatusOptions = (status, marineLicenceEnabled = true) => {
  const isMultipleSelected = Array.isArray(status)

  return Object.entries(PROJECT_STATUS)
    .filter(
      ([key]) =>
        marineLicenceEnabled || !MARINE_LICENCE_ONLY_STATUS_KEYS.has(key)
    )
    .map(([key, val]) => ({
      value: key,
      text: val === PROJECT_STATUS.REJECTED ? UNABLE_TO_PROGRESS : val,
      checked: isMultipleSelected ? status.includes(key) : status === key
    }))
    .sort((a, b) => a.text.localeCompare(b.text))
}

export const getTypeOptions = (type) => {
  const isMultipleSelected = Array.isArray(type)

  return [
    {
      value: 'exemption',
      text: EXEMPTION_TYPE,
      checked: isMultipleSelected
        ? type.includes(PROJECT_TYPE.EXEMPTION)
        : type === PROJECT_TYPE.EXEMPTION
    },
    {
      value: 'marine-licence',
      text: MARINE_LICENCE_TYPE,
      checked: isMultipleSelected
        ? type.includes(PROJECT_TYPE.MARINE_LICENCE)
        : type === PROJECT_TYPE.MARINE_LICENCE
    }
  ]
}

export const getUserOptions = (userSession, users, searchParams = {}) => {
  if (!userSession) {
    return []
  }

  const { show, user: userSearchParam = [] } = searchParams

  const { contactId, displayName } = userSession

  const ownOption = [
    {
      value: contactId,
      text: `Mine (${displayName})`,
      checked: show === 'specific-user' && userSearchParam.includes(contactId)
    }
  ]

  const hasUsers = users && Object.keys(users).length > 0

  const userOptions = hasUsers
    ? Object.entries(users)
        .filter(([userContactId]) => userContactId !== contactId)
        .map(([userContactId, userDisplayName]) => ({
          value: userContactId,
          text: userDisplayName,
          checked:
            show === 'specific-user' && userSearchParam.includes(userContactId)
        }))
    : []

  return [...ownOption, ...userOptions]
}

export const addUsersToProjects = (projects, users) =>
  projects.map((project) => ({
    ...project,
    ownerName: users[project.contactId] || '-'
  }))
