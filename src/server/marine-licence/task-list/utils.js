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
        text: 'In progress',
        classes: 'govuk-tag--teal'
      }
    }
  }

  if (task === 'NOT_ACCEPTED') {
    return {
      tag: {
        text: 'Not accepted',
        classes: 'govuk-tag--red'
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
  const publicConsultation = {
    title: { text: 'Pre-application consultation', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_CONSULTATION,
    status: setStatus(taskList.publicConsultation)
  }

  const harbourAuthority = {
    title: { text: 'Harbour authority', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_HARBOUR_AUTHORITY,
    status: setStatus(taskList.harbourAuthority)
  }

  return isCitizen
    ? [harbourAuthority, otherAuthorities, publicConsultation]
    : [
        specialLegalPowers,
        harbourAuthority,
        otherAuthorities,
        publicConsultation
      ]
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
  },
  {
    title: {
      text: 'Preferred start and end dates of the licence',
      classes: taskClasses
    },
    href: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
    status: setStatus(taskList.preferredDates)
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

const getWaterFrameworkDirectiveHref = (waterFrameworkDirective) => {
  if (!waterFrameworkDirective?.nauticalMile) {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
  }

  if (waterFrameworkDirective.nauticalMile === 'yes') {
    return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
  }

  return marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
}

export const transformMarinePlanPoliciesTaskList = (
  taskList,
  { marinePlanPolicyJob, marinePlanPoliciesCount }
) => {
  const isAvailable =
    taskList.siteDetails === 'COMPLETED' && marinePlanPolicyJob === 'ready'

  if (!isAvailable) {
    return [
      {
        title: { text: 'Marine plan policy considerations' },
        status: {
          text: 'Cannot start yet',
          classes: 'govuk-task-list__status--cannot-start-yet'
        }
      }
    ]
  }

  const countSuffix =
    typeof marinePlanPoliciesCount === 'number'
      ? ` (${marinePlanPoliciesCount} to complete)`
      : ''

  return [
    {
      title: {
        text: `Marine plan policy considerations${countSuffix}`,
        classes: taskClasses
      },
      href: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
      status: { tag: { text: 'Not yet started', classes: 'govuk-tag--blue' } }
    }
  ]
}

export const transformWaterFrameworkDirectiveTaskList = (
  taskList,
  waterFrameworkDirective
) => [
  {
    title: {
      text: 'Water Framework Directive assessment',
      classes: taskClasses
    },
    href:
      taskList.waterFrameworkDirective === 'INCOMPLETE'
        ? marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
        : getWaterFrameworkDirectiveHref(waterFrameworkDirective),
    status: setStatus(taskList.waterFrameworkDirective)
  }
]

export const transformFeeEstimateTaskList = (taskList) => [
  {
    title: { text: 'Fee estimate', classes: taskClasses },
    href: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
    status: setStatus(taskList.feeEstimate)
  }
]
