import { transformTaskList } from '~/src/server/exemption/task-list/utils.js'
import { mockExemptionTaskList } from '~/src/server/test-helpers/mocks.js'

describe('taskList utils', () => {
  test('transformTaskList correctly returns task list', () => {
    expect(transformTaskList(mockExemptionTaskList)).toEqual([
      {
        href: '/exemption/project-name',
        status: { text: 'Completed' },
        title: { text: 'Project name' }
      }
    ])
  })

  test('transformTaskList correctly handles empty values', () => {
    expect(transformTaskList({})).toEqual([
      {
        href: '/exemption/project-name',
        status: { tag: { text: 'Incomplete', classes: 'govuk-tag--blue' } },
        title: { text: 'Project name' }
      }
    ])
  })
})
