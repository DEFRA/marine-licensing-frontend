import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const taskClasses = 'govuk-link--no-visited-state'

const setStatus = (task) => {
  if (!task || task === 'INCOMPLETE') {
    return {
      tag: {
        text: 'Not yet started',
        classes: 'govuk-tag--blue'
      }
    }
  }

  if (task === 'IN_PROGRESS') {
    return {
      tag: {
        text: 'In Progress',
        classes: 'govuk-tag--light-blue'
      }
    }
  }

  return {
    text: 'Completed'
  }
}

export const transformSharingTaskList = (taskList) => [
  {
    title: {
      text: 'Sharing your project information publicly',
      classes: taskClasses
    },
    href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER,
    status: setStatus(taskList.publicRegister)
  }
]

export const transformOtherPermissionsTaskList = (taskList, isCitizen) => {
  const otherAuthorities = {
    title: { text: 'Other authorities', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_OTHER_AUTHORITIES,
    status: setStatus(taskList.otherAuthorities)
  }
  const specialLegalPowers = {
    title: { text: 'Special legal powers', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_SPECIAL_LEGAL_POWERS,
    status: setStatus(taskList.specialLegalPowers)
  }
  return isCitizen ? [otherAuthorities] : [specialLegalPowers, otherAuthorities]
}

export const transformProjectDetailsTaskList = (taskList) => [
  {
    title: { text: 'Project name', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
    status: setStatus(taskList.projectName)
  },
  {
    title: { text: 'Project background', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
    status: setStatus(taskList.projectBackground)
  }
]

export const transformSiteDetailsTaskList = (taskList) => [
  {
    title: { text: 'Site details', classes: taskClasses },
    href:
      !taskList.siteDetails || taskList.siteDetails === 'INCOMPLETE'
        ? marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS
        : marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
    status: setStatus(taskList.siteDetails)
  }
]
