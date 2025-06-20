import { transformTaskList } from '~/src/server/exemption/task-list/utils.js'
import { mockExemptionTaskList } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('taskList utils', () => {
  test('transformTaskList correctly returns task list', () => {
    expect(transformTaskList(mockExemptionTaskList)).toEqual([
      {
        href: routes.PROJECT_NAME,
        status: { text: 'Completed' },
        title: { text: 'Project name' }
      },
      {
        href: routes.ACTIVITY_DATES,
        status: { text: 'Completed' },
        title: { text: 'Activity dates' }
      },
      {
        href: routes.ACTIVITY_DESCRIPTION,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Activity description' }
      },
      {
        href: routes.REVIEW_SITE_DETAILS,
        status: { text: 'Completed' },
        title: { text: 'Site details' }
      },
      {
        href: routes.PUBLIC_REGISTER,
        status: { text: 'Completed' },
        title: { text: 'Public register' }
      }
    ])
  })

  test('transformTaskList correctly returns task list when site details is empty', () => {
    expect(
      transformTaskList({
        ...mockExemptionTaskList,
        siteDetails: null
      })
    ).toEqual([
      {
        href: routes.PROJECT_NAME,
        status: { text: 'Completed' },
        title: { text: 'Project name' }
      },
      {
        href: routes.ACTIVITY_DATES,
        status: { text: 'Completed' },
        title: { text: 'Activity dates' }
      },
      {
        href: routes.ACTIVITY_DESCRIPTION,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Activity description' }
      },
      {
        href: routes.COORDINATES_TYPE_CHOICE,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Site details' }
      },
      {
        href: routes.PUBLIC_REGISTER,
        status: { text: 'Completed' },
        title: { text: 'Public register' }
      }
    ])
  })

  test('transformTaskList correctly handles empty values', () => {
    expect(transformTaskList({})).toEqual([
      {
        href: routes.PROJECT_NAME,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Project name' }
      },
      {
        href: routes.ACTIVITY_DATES,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Activity dates' }
      },
      {
        href: routes.ACTIVITY_DESCRIPTION,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Activity description' }
      },
      {
        href: routes.COORDINATES_TYPE_CHOICE,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Site details' }
      },
      {
        href: routes.PUBLIC_REGISTER,
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Public register' }
      }
    ])
  })
})
