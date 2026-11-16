import { isMarineLicenceReadyToSend } from '#src/server/marine-licence/task-list/ready-to-send.js'
import {
  mockMarineLicenceApplication,
  withReadyToSend
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('isMarineLicenceReadyToSend', () => {
  const readyLicence = withReadyToSend(mockMarineLicenceApplication)

  const withTaskStatus = (task, status) => ({
    ...readyLicence,
    taskList: { ...readyLicence.taskList, [task]: status }
  })

  test('returns true when every task is completed', () => {
    expect(isMarineLicenceReadyToSend(readyLicence, true)).toBe(true)
  })

  test('returns false when site details are in progress', () => {
    expect(
      isMarineLicenceReadyToSend(
        withTaskStatus('siteDetails', 'IN_PROGRESS'),
        true
      )
    ).toBe(false)
  })

  test('returns false when the marine plan policy job is not ready', () => {
    expect(
      isMarineLicenceReadyToSend(
        { ...readyLicence, marinePlanPolicyJob: 'pending' },
        true
      )
    ).toBe(false)
  })

  test('returns false when not all marine plan policies have a response', () => {
    expect(
      isMarineLicenceReadyToSend(
        {
          ...readyLicence,
          marinePlanPoliciesCount: 2,
          marinePlanPolicyResponseCount: 1
        },
        true
      )
    ).toBe(false)
  })

  test('returns false when the water framework directive is in progress', () => {
    expect(
      isMarineLicenceReadyToSend(
        withTaskStatus('waterFrameworkDirective', 'IN_PROGRESS'),
        true
      )
    ).toBe(false)
  })

  test('ignores special legal powers for citizens', () => {
    const licence = withTaskStatus('specialLegalPowers', 'INCOMPLETE')

    expect(isMarineLicenceReadyToSend(licence, true)).toBe(true)
    expect(isMarineLicenceReadyToSend(licence, false)).toBe(false)
  })
})
