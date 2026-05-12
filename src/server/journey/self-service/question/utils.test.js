import { toArray } from '#src/server/journey/self-service/question/utils.js'

describe('#toArray', () => {
  test('returns the same array when given an array', () => {
    const input = ['a', 'b']
    expect(toArray(input)).toBe(input)
  })

  test('returns an empty array when given an empty array', () => {
    expect(toArray([])).toEqual([])
  })

  test('wraps a non-empty string in a single-element array', () => {
    expect(toArray('answer-id')).toEqual(['answer-id'])
  })

  test('returns an empty array for an empty string', () => {
    expect(toArray('')).toEqual([])
  })

  test('returns an empty array for undefined', () => {
    expect(toArray(undefined)).toEqual([])
  })

  test('returns an empty array for null', () => {
    expect(toArray(null)).toEqual([])
  })
})
