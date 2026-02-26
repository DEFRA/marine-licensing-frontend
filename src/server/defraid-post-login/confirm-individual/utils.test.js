import { generateHeadingText } from '#src/server/defraid-post-login/confirm-individual/utils.js'

describe('#generateHeadingText', () => {
  test('should correctly format text', () => {
    const result = generateHeadingText({ displayName: 'Test User' })

    expect(result).toBe(
      `Confirm you're notifying us as Test User for a personal project`
    )
  })
})
