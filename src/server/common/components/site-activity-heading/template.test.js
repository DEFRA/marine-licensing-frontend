import { renderComponentJSDOM } from '~/src/server/test-helpers/component-helpers.js'

describe('Site Activity Heading Component', () => {
  test('Should render text provided when set', () => {
    const siteActivityHeading = renderComponentJSDOM('site-activity-heading', {
      projectName: 'test project name',
      siteNumber: 1,
      activityDetailsNumber: 1,
      heading: 'Test heading'
    })

    const captions = siteActivityHeading.querySelectorAll('.govuk-caption-l')

    expect(captions[0].textContent).toBe('test project name')
    expect(captions[1].textContent).toBe('Site 1 - Activity 1')
    expect(siteActivityHeading.querySelector('h1').textContent).toBe(
      'Test heading'
    )
  })

  test('Should handle missing projectName', () => {
    const siteActivityHeading = renderComponentJSDOM('site-activity-heading', {
      siteNumber: 1,
      activityDetailsNumber: 1,
      heading: 'Test heading'
    })

    const captions = siteActivityHeading.querySelectorAll('.govuk-caption-l')

    expect(captions[0].textContent).toBe('Site 1 - Activity 1')
    expect(siteActivityHeading.querySelector('h1').textContent).toBe(
      'Test heading'
    )
  })

  test('Should handle missing number value', () => {
    const siteActivityHeading = renderComponentJSDOM('site-activity-heading', {
      projectName: 'test project name',
      siteNumber: 1,
      heading: 'Test heading'
    })

    const captions = siteActivityHeading.querySelectorAll('.govuk-caption-l')

    expect(captions[0].textContent).toBe('test project name')
    expect(captions.length).toBe(1)
    expect(siteActivityHeading.querySelector('h1').textContent).toBe(
      'Test heading'
    )
  })
})
