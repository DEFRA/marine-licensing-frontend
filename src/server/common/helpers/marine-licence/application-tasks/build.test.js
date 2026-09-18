import { buildApplicationTasks } from '#src/server/common/helpers/marine-licence/application-tasks/build.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

const CONTACT_ID = 'contact-1'
const MARINE_LICENCE_ID = '507f1f77bcf86cd799439011'

const buildTask = (overrides = {}) => ({
  taskId: 'task-1',
  type: APPLICATION_TASK_TYPE.WITHHOLDING_NOTIFICATION,
  receivedAt: '2026-08-14T10:00:00.000Z',
  resolvedAt: null,
  data: {},
  ...overrides
})

const buildMarineLicence = (applicationTasks) => ({
  id: MARINE_LICENCE_ID,
  contactId: CONTACT_ID,
  applicationTasks
})

const build = (args) =>
  buildApplicationTasks({
    marineLicence: buildMarineLicence([buildTask()]),
    currentContactId: CONTACT_ID,
    isApplicantView: true,
    ...args
  })

describe('buildApplicationTasks', () => {
  it('shows the task to the person who submitted the application', () => {
    expect(build()).toEqual([
      {
        title: { text: 'Notification about withholding information' },
        href: `/marine-licence/withholding-notification/${MARINE_LICENCE_ID}`,
        status: {
          tag: { text: 'Not yet read', classes: 'govuk-tag--red' }
        }
      }
    ])
  })

  it('hides the section from another person in the same organisation', () => {
    expect(build({ currentContactId: 'someone-else' })).toEqual([])
  })

  it('hides the section from public and internal views', () => {
    expect(build({ isApplicantView: false })).toEqual([])
  })

  it('hides the section when there is no signed-in user', () => {
    expect(build({ currentContactId: undefined })).toEqual([])
  })

  it('returns nothing when the application has no tasks', () => {
    expect(build({ marineLicence: buildMarineLicence([]) })).toEqual([])
  })

  it('returns nothing when applicationTasks is absent', () => {
    expect(
      build({ marineLicence: { id: MARINE_LICENCE_ID, contactId: CONTACT_ID } })
    ).toEqual([])
  })

  it('shows a resolved task as plain Read text rather than a tag', () => {
    const [item] = build({
      marineLicence: buildMarineLicence([
        buildTask({ resolvedAt: '2026-08-15T10:00:00.000Z' })
      ])
    })

    expect(item.status).toEqual({ text: 'Read' })
  })

  it('lists outstanding tasks above resolved ones', () => {
    const items = build({
      marineLicence: buildMarineLicence([
        buildTask({
          taskId: 'resolved',
          receivedAt: '2026-08-01T10:00:00.000Z',
          resolvedAt: '2026-08-02T10:00:00.000Z'
        }),
        buildTask({ taskId: 'outstanding' })
      ])
    })

    expect(items.map((item) => item.status)).toEqual([
      { tag: { text: 'Not yet read', classes: 'govuk-tag--red' } },
      { text: 'Read' }
    ])
  })

  it('skips a task type it does not recognise', () => {
    expect(
      build({
        marineLicence: buildMarineLicence([
          buildTask({ type: 'SOMETHING_NEW' })
        ])
      })
    ).toEqual([])
  })
})
