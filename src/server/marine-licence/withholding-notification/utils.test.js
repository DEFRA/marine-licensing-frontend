import {
  buildWithholdingSections,
  findWithholdingTask
} from '#src/server/marine-licence/withholding-notification/utils.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

const buildTask = (data) => ({
  taskId: 'task-1',
  type: APPLICATION_TASK_TYPE.WITHHOLDING_NOTIFICATION,
  data
})

describe('findWithholdingTask', () => {
  it('finds the withholding task among other task types', () => {
    const task = buildTask({})
    expect(
      findWithholdingTask({
        applicationTasks: [{ type: 'SOMETHING_ELSE' }, task]
      })
    ).toBe(task)
  })

  it('returns undefined when there is no withholding task', () => {
    expect(findWithholdingTask({ applicationTasks: [] })).toBeUndefined()
    expect(findWithholdingTask({})).toBeUndefined()
  })
})

describe('buildWithholdingSections', () => {
  it('renders both sections in order when the decision covered both', () => {
    const sections = buildWithholdingSections(
      buildTask({
        nationalSecurity: {
          decision: 'DISAGREE',
          applicantMessage: 'NS comments'
        },
        commercialConfidentiality: {
          decision: 'AGREE_IN_PART',
          applicantMessage: 'CC comments'
        }
      })
    )

    expect(sections).toEqual([
      {
        heading: 'National security',
        decision:
          "We've decided not to withhold the information you asked us to.",
        paragraphs: ['NS comments']
      },
      {
        heading: 'Commercial or industrial confidentiality',
        decision:
          "We've agreed to withhold some of the information you asked us to.",
        paragraphs: ['CC comments']
      }
    ])
  })

  it('omits commercial confidentiality when the decision did not cover it', () => {
    const sections = buildWithholdingSections(
      buildTask({
        nationalSecurity: { decision: 'AGREE', applicantMessage: 'x' }
      })
    )

    expect(sections).toHaveLength(1)
    expect(sections[0].heading).toBe('National security')
  })

  it('omits national security when the decision did not cover it', () => {
    const sections = buildWithholdingSections(
      buildTask({
        commercialConfidentiality: {
          decision: 'DISAGREE',
          applicantMessage: 'x'
        }
      })
    )

    expect(sections).toHaveLength(1)
    expect(sections[0].heading).toBe('Commercial or industrial confidentiality')
  })

  it('starts a new paragraph at every newline, so nothing the caseworker typed is lost', () => {
    const [section] = buildWithholdingSections(
      buildTask({
        nationalSecurity: {
          decision: 'AGREE',
          applicantMessage: 'Withheld fields:\nName\nAddress'
        }
      })
    )

    expect(section.paragraphs).toEqual(['Withheld fields:', 'Name', 'Address'])
  })

  it('splits the caseworker comments into paragraphs on blank lines', () => {
    const [section] = buildWithholdingSections(
      buildTask({
        commercialConfidentiality: {
          decision: 'AGREE_IN_PART',
          applicantMessage: 'First paragraph.\n\nSecond paragraph.'
        }
      })
    )

    expect(section.paragraphs).toEqual([
      'First paragraph.',
      'Second paragraph.'
    ])
  })

  it('handles a missing applicant message without producing an empty paragraph', () => {
    const [section] = buildWithholdingSections(
      buildTask({ nationalSecurity: { decision: 'AGREE' } })
    )

    expect(section.paragraphs).toEqual([])
  })

  it('renders the wording for a decision to withhold everything asked', () => {
    const [section] = buildWithholdingSections(
      buildTask({
        nationalSecurity: { decision: 'AGREE', applicantMessage: 'x' }
      })
    )

    expect(section.decision).toBe(
      "We've agreed to withhold the information you asked us to."
    )
  })

  it('renders no decision line for a decision it has no wording for', () => {
    const [section] = buildWithholdingSections(
      buildTask({
        nationalSecurity: { decision: 'MAYBE', applicantMessage: 'x' }
      })
    )

    expect(section.decision).toBe('')
    expect(section.paragraphs).toEqual(['x'])
  })

  it('returns nothing when the task has no decision data', () => {
    expect(buildWithholdingSections(buildTask({}))).toEqual([])
    expect(buildWithholdingSections(undefined)).toEqual([])
  })
})
