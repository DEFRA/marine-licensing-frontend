import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

const document = {
  filename: 'survey.pdf',
  type: 'Heritage Assessment',
  typeOther: '',
  policies: [
    { title: 'South Climate change 1 (S-CC-1)', location: 'Page 1' },
    { title: 'South Climate change 2 (S-CC-2)', location: 'Page 2' }
  ],
  deleteHref: '/delete/doc-1',
  changeTypeHref: '/type/doc-1?action=change',
  changePoliciesHref: '/policy/doc-1?action=change'
}

const render = (params) =>
  renderComponent('marine-licence/marine-plan-policy-documents-card', params)

describe('Marine Licence Marine Plan Policy Documents Card Component', () => {
  test('renders one card per document titled with the filename', () => {
    const $ = render({
      documents: [document, { ...document, filename: 'second.pdf' }]
    })

    expect($('.govuk-summary-card')).toHaveLength(2)
    expect($('#document-card-1 .govuk-summary-card__title').text().trim()).toBe(
      'survey.pdf'
    )
    expect($('#document-card-2 .govuk-summary-card__title').text().trim()).toBe(
      'second.pdf'
    )
  })

  test('renders the type and linked policies', () => {
    const $ = render({ documents: [document] })

    const values = $('.govuk-summary-list__value')
    expect(values.eq(0).text().trim()).toBe('Heritage Assessment')
    expect(
      values
        .eq(1)
        .find('li')
        .map((_, el) => $(el).text().trim())
        .get()
    ).toEqual([
      'South Climate change 1 (S-CC-1) - Page 1',
      'South Climate change 2 (S-CC-2) - Page 2'
    ])
  })

  test('renders the other type description on a new line', () => {
    const $ = render({
      documents: [
        { ...document, type: 'Other supporting evidence', typeOther: 'Survey' }
      ]
    })

    const typeValue = $('.govuk-summary-list__value').eq(0)
    expect(typeValue.find('br')).toHaveLength(1)
    expect(typeValue.text()).toContain('Survey')
  })

  test('escapes user-provided text', () => {
    const $ = render({
      documents: [
        {
          ...document,
          filename: '<b>file</b>',
          typeOther: '<script>alert(1)</script>',
          policies: [{ title: '<i>Climate</i>', location: '<u>Page 1</u>' }]
        }
      ]
    })

    expect($('.govuk-summary-card b, script, i, u')).toHaveLength(0)
    expect($.html()).toContain('&lt;script&gt;')
  })

  test('shows delete and change links when not read only', () => {
    const $ = render({ documents: [document] })

    expect($('.govuk-summary-card__actions a').attr('href')).toBe(
      '/delete/doc-1'
    )
    expect(
      $('.govuk-summary-list__actions a')
        .map((_, el) => $(el).attr('href'))
        .get()
    ).toEqual(['/type/doc-1?action=change', '/policy/doc-1?action=change'])
  })

  test('hides all links when read only', () => {
    const $ = render({ documents: [document], isReadOnly: true })

    expect($('.govuk-summary-card a')).toHaveLength(0)
  })

  test('renders no cards when there are no documents', () => {
    const $ = render({ documents: [] })

    expect($('.govuk-summary-card')).toHaveLength(0)
  })
})
