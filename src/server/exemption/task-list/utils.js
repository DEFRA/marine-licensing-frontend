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
      href: '/exemption/project-name',
      status: setStatus(taskList.projectName)
    },
    {
      title: {
        text: 'Public register'
      },
      href: '/exemption/public-register',
      status: setStatus(taskList.publicRegister)
    }
  ]
}
