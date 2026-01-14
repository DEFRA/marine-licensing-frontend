export const PROJECT_NAME_VIEW_ROUTE = 'marine-license/project-name/index'

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

export const projectNameController = {
  handler(_request, h) {
    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings
    })
  }
}
