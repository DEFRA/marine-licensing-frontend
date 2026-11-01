import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('radioPage Component', () => {
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
      heading: 'Test heading',
      cancelLink: '#'
    })

    const legend = $radioPage('.govuk-fieldset__legend')

    expect(legend).toHaveLength(1)
    expect(legend.children('h1').text().trim()).toBe('Test heading')

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
      heading: 'Test heading',
      cancelLink: '#'
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
      cancelLink: '#',
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
      cancelLink: '#',
      hint: { html: '<h2>test hint text</h2>' }
    })

    expect($radioPage('.govuk-hint')).toHaveLength(1)
    expect($radioPage('.govuk-hint').find('h2').text().trim()).toBe(
      'test hint text'
    )
  })

  describe('with contentHtml', () => {
    const contentTestData = {
      ...commonTestData,
      isPageHeading: true,
      heading: 'Test heading',
      cancelLink: '#',
      contentHtml: '<ul><li>item one</li><li>item two</li></ul>'
    }

    test('Should render the heading, caption and content outside the fieldset', () => {
      $radioPage = renderComponent('radio-page', contentTestData)

      const fieldset = $radioPage('fieldset')
      expect($radioPage('h1').text().trim()).toBe('Test heading')
      expect(fieldset.find('h1')).toHaveLength(0)
      expect(fieldset.find('.govuk-caption-l')).toHaveLength(0)
      expect(fieldset.find('ul')).toHaveLength(0)
      expect($radioPage('.govuk-hint')).toHaveLength(0)
      expect($radioPage('li').first().text().trim()).toBe('item one')
      expect($radioPage('.govuk-caption-l').text().trim()).toBe('test project')
    })

    test('Should use the heading as a visually hidden legend when no legend is given', () => {
      $radioPage = renderComponent('radio-page', contentTestData)

      const legend = $radioPage('.govuk-fieldset__legend')
      expect(legend).toHaveLength(1)
      expect(legend.hasClass('govuk-visually-hidden')).toBe(true)
      expect(legend.text().trim()).toBe('Test heading')
    })

    test('Should render a given legend as a visible medium heading', () => {
      $radioPage = renderComponent('radio-page', {
        ...contentTestData,
        legend: 'Test question'
      })

      const legend = $radioPage('.govuk-fieldset__legend')
      expect(legend.hasClass('govuk-fieldset__legend--m')).toBe(true)
      expect(legend.hasClass('govuk-visually-hidden')).toBe(false)
      expect(legend.children('h2').text().trim()).toBe('Test question')
    })

    test('Should keep the heading and content outside the error group', () => {
      $radioPage = renderComponent('radio-page', {
        ...contentTestData,
        legend: 'Test question',
        errorMessage: { text: 'test error' }
      })

      const errorGroup = $radioPage('.govuk-form-group--error')
      expect(errorGroup).toHaveLength(1)
      expect(errorGroup.find('h2').text().trim()).toBe('Test question')
      expect(errorGroup.find('.govuk-error-message').text().trim()).toBe(
        'Error: test error'
      )
      expect(errorGroup.find('h1')).toHaveLength(0)
      expect(errorGroup.find('ul')).toHaveLength(0)
    })
  })
})
