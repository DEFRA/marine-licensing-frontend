import { transformTaskList } from '#src/server/marine-licence/task-list/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('taskList utils', () => {
  test('transformTaskList correctly returns task list with Completed status', () => {
    expect(
      transformTaskList({
        projectName: 'COMPLETED'
      })
    ).toEqual([
      {
        href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
        status: { text: 'Completed' },
        title: {
          classes: 'govuk-link--no-visited-state',
          text: 'Project name'
        }
      }
    ])
  })

  test('transformTaskList correctly returns In Progress', () => {
    expect(
      transformTaskList({
        projectName: 'IN_PROGRESS'
      })
    ).toEqual([
      {
        href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
        status: {
          tag: { text: 'In Progress', classes: 'govuk-tag--light-blue' }
        },
        title: { classes: 'govuk-link--no-visited-state', text: 'Project name' }
      }
    ])
  })

  test('transformTaskList correctly returns Not yet started for null', () => {
    expect(
      transformTaskList({
        projectName: null
      })
    ).toEqual([
      {
        href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
        status: {
          tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
        },
        title: { classes: 'govuk-link--no-visited-state', text: 'Project name' }
      }
    ])
  })

  test('transformTaskList correctly returns Not yet started for INCOMPLETE', () => {
    expect(
      transformTaskList({
        projectName: 'INCOMPLETE'
      })
    ).toEqual([
      {
        href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
        status: {
          tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
        },
        title: { classes: 'govuk-link--no-visited-state', text: 'Project name' }
      }
    ])
  })

  test('transformTaskList correctly returns Not yet started for undefined', () => {
    expect(
      transformTaskList({
        projectName: undefined
      })
    ).toEqual([
      {
        href: marineLicenceRoutes.MARINE_LICENCE_PROJECT_NAME,
        status: {
          tag: { text: 'Not yet started', classes: 'govuk-tag--blue' }
        },
        title: { classes: 'govuk-link--no-visited-state', text: 'Project name' }
      }
    ])
  })
})
