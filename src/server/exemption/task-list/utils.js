import { routes } from '~/src/server/common/constants/routes.js'

/**
 * Set text for front end display
 * @param { string } task
 */
const setStatus = (task) => {
  if (!task) {
    return {
      tag: {
        text: 'Incomplete',
        classes: 'govuk-tag--blue'
      }
    }
  }

  return {
    text: 'Completed'
  }
}

/**
 * Format task list to work with front end component
 * @param { {[key: string]: string} } taskList
 */
export const transformTaskList = (taskList) => {
  return [
    {
      title: {
        text: 'Project name'
      },
      href: routes.PROJECT_NAME,
      status: setStatus(taskList.projectName)
    },

    {
      title: {
        text: 'Site details'
      },
      href: routes.COORDINATES_TYPE_CHOICE,
      status: setStatus(taskList.siteDetails)
    },
    {
      title: {
        text: 'Public register'
      },
      href: routes.PUBLIC_REGISTER,
      status: setStatus(taskList.publicRegister)
    }
  ]
}
