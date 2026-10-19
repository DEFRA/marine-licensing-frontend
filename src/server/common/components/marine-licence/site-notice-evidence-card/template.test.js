import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Marine Licence Site Notice Evidence Card', () => {
  const baseParams = {
    evidenceIndex: 1,
    locationName: 'Harbour wall',
    locationNameHref:
      '/marine-licence/site-notice/location-name/abc123?location=1',
    dateDisplayed: '5 March 2026',
    dateDisplayedHref:
      '/marine-licence/site-notice/date-displayed/abc123?location=1',
    closeUpPhoto: 'close-up.jpg',
    closeUpPhotoHref:
      '/marine-licence/site-notice/close-up-photo/abc123?location=1',
    positionPhoto: 'position.jpg',
    positionPhotoHref:
      '/marine-licence/site-notice/position-photo/abc123?location=1'
  }

  test('should render all 4 rows with correct keys', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      baseParams
    )
    const rows = $component('.govuk-summary-list__key')
    expect(rows).toHaveLength(4)
    expect(rows.eq(0).text()).toContain('Location name')
    expect(rows.eq(1).text()).toContain('Date you displayed the notice')
    expect(rows.eq(2).text()).toContain('Close-up photo of notice')
    expect(rows.eq(3).text()).toContain(
      'Photo evidencing notice position and location'
    )
  })

  test('should render values from params', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      baseParams
    )
    const values = $component('.govuk-summary-list__value')
    expect(values.eq(0).text()).toContain('Harbour wall')
    expect(values.eq(1).text()).toContain('5 March 2026')
    expect(values.eq(2).text()).toContain('close-up.jpg')
    expect(values.eq(3).text()).toContain('position.jpg')
  })

  test('should render Change links for each row', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      baseParams
    )
    const links = $component('.govuk-summary-list__actions a')
    expect(links).toHaveLength(4)
    expect(links.eq(0).attr('href')).toContain('location=1')
    expect(links.eq(1).attr('href')).toContain('location=1')
    expect(links.eq(2).attr('href')).toContain('location=1')
    expect(links.eq(3).attr('href')).toContain('location=1')
    expect($component('.govuk-summary-card__actions a')).toHaveLength(0)
  })

  test('should render Add links for empty fields', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      {
        ...baseParams,
        locationName: '',
        dateDisplayed: undefined,
        closeUpPhoto: null,
        positionPhoto: ''
      }
    )
    const links = $component('.govuk-summary-list__actions a')
    expect(links).toHaveLength(4)
    links.each((_, link) => {
      expect($component(link).text()).toMatch(/^Add/)
    })
  })

  test('should render card title with evidence index', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      {
        ...baseParams,
        evidenceIndex: 3
      }
    )
    expect($component('.govuk-summary-card__title').text()).toContain(
      'Location 3 evidence'
    )
  })

  test('should render card attributes when provided', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      {
        ...baseParams,
        cardAttributes: { id: 'site-location-1' }
      }
    )
    expect($component('.govuk-summary-card').attr('id')).toBe('site-location-1')
  })

  test('should not render Change or Delete links when evidenceSubmission is true', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      {
        ...baseParams,
        deleteHref: '/delete?location=2',
        evidenceSubmission: true
      }
    )
    expect($component('.govuk-summary-list__actions a')).toHaveLength(0)
    expect($component('.govuk-summary-card__actions a')).toHaveLength(0)
  })

  test('should render Delete location link when deleteHref is set', () => {
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      { ...baseParams, evidenceIndex: 2, deleteHref: '/delete?location=2' }
    )
    const link = $component('.govuk-summary-card__actions a')
    expect(link.attr('href')).toBe('/delete?location=2')
    expect(link.text()).toContain('Delete location')
    expect(link.find('.govuk-visually-hidden').text()).toContain('2')
  })

  test('should render "Incomplete" marker when value is missing', () => {
    const params = { ...baseParams, locationName: null }
    const $component = renderComponent(
      'marine-licence/site-notice-evidence-card',
      params
    )
    expect($component('.govuk-tag--red').first().text()).toContain('Incomplete')
  })

  describe('for a resubmission', () => {
    const resubmissionParams = {
      evidenceIndex: 3,
      locationName: 'Harbour wall',
      dateDisplayed: '5 March 2026',
      rejectionReason: 'The close-up photo is blurred.',
      closeUpPhoto: null,
      closeUpPhotoHref: '/resubmit/close-up-photo?location=3',
      positionPhoto: 'position.jpg',
      positionPhotoHref: '/resubmit/position-photo?location=3',
      addWhenIncomplete: true
    }

    const render = (params = resubmissionParams) =>
      renderComponent('marine-licence/site-notice-evidence-card', params)

    test('adds the caseworker reason after the date', () => {
      const $component = render()

      const keys = $component('.govuk-summary-list__key')
      expect(keys).toHaveLength(5)
      expect(keys.eq(2).text()).toContain(
        'Why we could not accept your photographs'
      )
      expect($component('.govuk-summary-list__value').eq(2).text()).toContain(
        'The close-up photo is blurred.'
      )
    })

    test('escapes the caseworker reason', () => {
      const $component = render({
        ...resubmissionParams,
        rejectionReason: '<b>bold</b>'
      })

      expect($component('.govuk-summary-list__value b')).toHaveLength(0)
      expect($component('.govuk-summary-list__value').eq(2).text()).toContain(
        '<b>bold</b>'
      )
    })

    test('shows the location name and date without links when no link is given', () => {
      const $component = render()

      const rows = $component('.govuk-summary-list__row')
      expect(rows.eq(0).find('a')).toHaveLength(0)
      expect(rows.eq(1).find('a')).toHaveLength(0)
    })

    test('offers Add for a missing photo and Change for one already added', () => {
      const links = render()('.govuk-summary-list__actions a')

      expect(links).toHaveLength(2)
      expect(links.eq(0).text()).toMatch(/^Add\b/)
      expect(links.eq(1).text()).toMatch(/^Change\b/)
    })
  })
})
