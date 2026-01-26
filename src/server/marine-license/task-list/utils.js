import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'

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

export const transformTaskList = (taskList) => {
  const classes = 'govuk-link--no-visited-state'
  return [
    {
      title: {
        text: 'Project name',
        classes
      },
      href: marineLicenseRoutes.MARINE_LICENSE_PROJECT_NAME,
      status: setStatus(taskList.projectName)
    }
  ]
}
