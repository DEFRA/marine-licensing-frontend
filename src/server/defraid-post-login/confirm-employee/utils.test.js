import {
  generateErrorText,
  generateHeadingText
} from '#src/server/defraid-post-login/confirm-employee/utils.js'

describe('#generateHeadingText', () => {
  test('should correctly format text', () => {
    const result = generateHeadingText({ organisationName: 'Test Org' })

    expect(result).toBe(`Are you notifying us as an employee of Test Org?`)
  })
})

describe('#generateErrorText', () => {
  test('should correctly format text', () => {
    const result = generateErrorText({ organisationName: 'Test Org' })

    expect(result).toBe(`Select whether you are notifying us for Test Org`)
  })
})
