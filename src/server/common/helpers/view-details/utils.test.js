import { isProjectViewable } from './utils.js'
import { PROJECT_STATUS } from '#src/server/common/constants/projects.js'

describe('isProjectViewable', () => {
  describe('Allows project to be viewed', () => {
    test.each([
      ['Submitted', PROJECT_STATUS.SUBMITTED],
      ['Active', PROJECT_STATUS.ACTIVE],
      ['Withdrawn', PROJECT_STATUS.WITHDRAWN]
    ])(
      'when status is %s and applicationReference is present',
      (_label, status) => {
        expect(
          isProjectViewable({ status, applicationReference: 'REF/2024/001' })
        ).toBe(true)
      }
    )
  })

  describe('Does not allow project to be viewed', () => {
    test('when status is Draft', () => {
      expect(
        isProjectViewable({
          status: PROJECT_STATUS.DRAFT,
          applicationReference: 'REF/2024/001'
        })
      ).toBe(false)
    })

    test.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', '']
    ])('when applicationReference is %s', (_label, applicationReference) => {
      expect(
        isProjectViewable({
          status: PROJECT_STATUS.SUBMITTED,
          applicationReference
        })
      ).toBe(false)
    })

    test('when status is Draft and applicationReference is missing', () => {
      expect(
        isProjectViewable({
          status: PROJECT_STATUS.DRAFT,
          applicationReference: null
        })
      ).toBe(false)
    })
  })
})
