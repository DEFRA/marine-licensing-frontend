import {
  errorDescriptionByFieldName,
  mapErrorMessage
} from '~/src/server/exemption/project-name/utils.js'

describe('#projectNameController/utils', () => {
  describe('#projectNameController/utils/errorDescriptionByFieldName', () => {
    test('return error formatted correctly for front end display', () => {
      const result = errorDescriptionByFieldName()
      expect(result).toEqual({})
    })

    test('return empty array when no data is provided', () => {
      const result = errorDescriptionByFieldName([
        {
          href: '#test',
          text: 'Test text',
          field: 'test'
        },
        {
          href: '#test2',
          text: 'Test text 2',
          field: 'test2'
        }
      ])

      expect(result).toEqual({
        test: {
          href: '#test',
          text: 'Test text',
          field: 'test'
        },
        test2: {
          href: '#test2',
          text: 'Test text 2',
          field: 'test2'
        }
      })
    })
  })

  describe('#projectNameController/utils/mapErrorMessage', () => {
    test('return input value if no error is specified', () => {
      const result = mapErrorMessage('Error')
      expect(result).toBe('Error')
    })

    test('return error if no text is specified', () => {
      const result = mapErrorMessage('PROJECT_NAME_REQUIRED')
      expect(result).toBe('Enter the project name')
    })

    test('return error if text is too long', () => {
      const result = mapErrorMessage('PROJECT_NAME_MAX_LENGTH')
      expect(result).toBe('Project name should be 250 characters or less')
    })
  })
})
