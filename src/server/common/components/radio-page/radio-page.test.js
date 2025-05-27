import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('radioPage Component', () => {
  /** @type {CheerioAPI} */
  let $radioPage

  const csrfToken = 'testCSRF'

  const commonTestData = {
    name: 'test-name',
    items: [
      {
        value: 'yes',
        text: 'Yes'
      },
      {
        value: 'no',
        text: 'No'
      }
    ],
    projectName: 'test project',
    csrfToken
  }

  test('Should render radio buttons page correctly with a heading inside the form element', () => {
    $radioPage = renderComponent('radio-page', {
      ...commonTestData,
      isPageHeading: true,
      heading: 'Test heading'
    })

    const legend = $radioPage('.govuk-fieldset__legend')

    expect(legend).toHaveLength(1)
    expect(legend.children('h1').html().trim()).toContain(
      '<span class="govuk-caption-l">test project</span>'
    )
    expect(legend.children('h1').html().trim()).toContain('Test heading')

    expect($radioPage('.govuk-caption-l').text().trim()).toBe('test project')

    expect($radioPage('input[name="test-name"]')).toHaveLength(2)
    expect($radioPage('input[value="yes"]')).toHaveLength(1)
    expect($radioPage('input[value="no"]')).toHaveLength(1)

    expect($radioPage('button').text().trim()).toBe('Continue')
    expect($radioPage('a').text().trim()).toBe('Cancel')
  })

  test('Should render radio buttons page correctly with a seperate heading', () => {
    $radioPage = renderComponent('radio-page', {
      ...commonTestData,
      heading: 'Test heading'
    })

    expect($radioPage('h1').text().trim()).toBe('Test heading')
    expect($radioPage('.govuk-fieldset__legend')).toHaveLength(0)
    expect($radioPage('.govuk-caption-l').text().trim()).toBe('test project')

    expect($radioPage('input[name="test-name"]')).toHaveLength(2)
    expect($radioPage('input[value="yes"]')).toHaveLength(1)
    expect($radioPage('input[value="no"]')).toHaveLength(1)

    expect($radioPage('button').text().trim()).toBe('Continue')
    expect($radioPage('a').text().trim()).toBe('Cancel')
  })

  test('Should render errors', () => {
    $radioPage = renderComponent('radio-page', {
      ...commonTestData,
      isPageHeading: true,
      heading: 'Test heading',
      errorSummary: [
        {
          href: '#test-name',
          text: 'test error',
          field: ['test-name']
        }
      ],
      errorMessage: { text: 'test error' }
    })

    expect($radioPage('.govuk-error-summary')).toHaveLength(1)
    expect($radioPage('.govuk-error-summary').find('a').text().trim()).toBe(
      'test error'
    )

    expect($radioPage('.govuk-error-message')).toHaveLength(1)
    expect($radioPage('.govuk-error-message').text().trim()).toBe(
      'Error: test error'
    )
  })

  test('Should render hint text', () => {
    $radioPage = renderComponent('radio-page', {
      ...commonTestData,
      isPageHeading: true,
      heading: 'Test heading',
      hint: { html: '<h2>test hint text</h2>' }
    })

    expect($radioPage('.govuk-hint')).toHaveLength(1)
    expect($radioPage('.govuk-hint').find('h2').text().trim()).toBe(
      'test hint text'
    )
  })
})

/**
 * @import { CheerioAPI } from 'cheerio'
 */
