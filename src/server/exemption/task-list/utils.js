import { routes } from '#src/server/common/constants/routes.js'
const setStatus = (task) => {
  if (!task || task === 'INCOMPLETE') {
    return {
      tag: {
        text: 'Incomplete',
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
export const transformTaskList = (taskList) => {
  const classes = 'govuk-link--no-visited-state'
  return [
    {
      title: {
        text: 'Project name',
        classes
      },
      href: routes.PROJECT_NAME,
      status: setStatus(taskList.projectName)
    },
    {
      title: {
        text: 'Site details',
        classes
      },
      href:
        !taskList.siteDetails || taskList.siteDetails === 'INCOMPLETE'
          ? routes.SITE_DETAILS
          : routes.REVIEW_SITE_DETAILS,
      status: setStatus(taskList.siteDetails)
    },
    {
      title: {
        text: 'Sharing your project information publicly',
        classes
      },
      href: routes.PUBLIC_REGISTER,
      status: setStatus(taskList.publicRegister)
    }
  ]
}
