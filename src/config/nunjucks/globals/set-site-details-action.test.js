import { setSiteDetailsAction } from '~/src/config/nunjucks/globals/set-site-details-action.js'

describe('setSiteDetailsAction', () => {
  test('should return correct structure with all parameters provided', () => {
    const result = setSiteDetailsAction(
      'Some value',
      '/site-details',
      1,
      'site name'
    )

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          href: '/site-details?site=1&action=change',
          text: 'Change',
          visuallyHiddenText: 'site name'
        }
      ]
    })
  })

  test('should handle different site numbers', () => {
    const result = setSiteDetailsAction(
      'Existing data',
      '/another-page',
      5,
      'for site 5'
    )

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          href: '/another-page?site=5&action=change',
          text: 'Change',
          visuallyHiddenText: 'for site 5'
        }
      ]
    })
  })

  test('should return "Add" text when value is null', () => {
    const result = setSiteDetailsAction(null, '/site-details', 1)

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          href: '/site-details?site=1&action=add',
          text: 'Add'
        }
      ]
    })
  })

  test('should return "Add" text when value is undefined', () => {
    const result = setSiteDetailsAction(undefined, '/site-details', 1)

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          href: '/site-details?site=1&action=add',
          text: 'Add'
        }
      ]
    })
  })

  test('should return "Add" text when value is empty string', () => {
    const result = setSiteDetailsAction('', '/site-details', 1)

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          href: '/site-details?site=1&action=add',
          text: 'Add'
        }
      ]
    })
  })

  test('should return "Change" text when not empty', () => {
    const result = setSiteDetailsAction('   ', '/site-details', 1)

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          href: '/site-details?site=1&action=change',
          text: 'Change'
        }
      ]
    })
  })

  test('should use fallback href when href is null', () => {
    const result = setSiteDetailsAction('Some value', null, 1)

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          text: 'Change'
        }
      ]
    })
  })

  test('should use fallback href when href is empty string', () => {
    const result = setSiteDetailsAction('Some value', '', 1)

    expect(result).toEqual({
      items: [
        {
          classes: 'govuk-link--no-visited-state',
          text: 'Change'
        }
      ]
    })
  })

  test('should include visuallyHiddenText when provided', () => {
    const result = setSiteDetailsAction(
      'Value',
      '/page',
      1,
      'Hidden description'
    )

    expect(result.items[0]).toHaveProperty(
      'visuallyHiddenText',
      'Hidden description'
    )
  })
})
