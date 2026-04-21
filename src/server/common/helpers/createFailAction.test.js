import { vi, describe, test, expect, beforeEach } from 'vitest'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'

describe('createFailAction', () => {
  const viewRoute = 'some/view'
  const settings = { pageTitle: 'Title', heading: 'Heading' }
  const errorMessages = { REQUIRED: 'Field is required' }
  const projectName = 'My Project'
  const backLink = '/back'
  const payload = { field: 'value' }

  let h
  let failAction

  beforeEach(() => {
    h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
    failAction = createFailAction({
      viewRoute,
      settings,
      errorMessages,
      projectName,
      backLink,
      payload
    })
  })

  test('renders view without errors when err.details is missing', () => {
    failAction({}, h, {})

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload,
      projectName,
      backLink
    })
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('renders view without errors when err.details is null', () => {
    failAction({}, h, { details: null })

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload,
      projectName,
      backLink
    })
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('renders view with mapped errors when err.details is present', () => {
    const err = {
      details: [{ path: ['field'], message: 'REQUIRED', type: 'string.empty' }]
    }

    failAction({}, h, err)

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload,
      projectName,
      backLink,
      errorSummary: [
        { href: '#field', text: 'Field is required', field: ['field'] }
      ],
      errors: {
        field: { href: '#field', text: 'Field is required', field: ['field'] }
      }
    })
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('uses raw message when not found in errorMessages', () => {
    const err = {
      details: [
        { path: ['field'], message: 'some.raw.message', type: 'any.required' }
      ]
    }

    failAction({}, h, err)

    expect(h.view).toHaveBeenCalledWith(
      viewRoute,
      expect.objectContaining({
        errorSummary: [
          { href: '#field', text: 'some.raw.message', field: ['field'] }
        ]
      })
    )
  })

  test('spreads params into the view context', () => {
    const cancelLink = '/cancel'
    const action = 'change'

    failAction = createFailAction({
      viewRoute,
      settings,
      errorMessages,
      projectName,
      backLink,
      payload,
      params: { cancelLink, siteNumber: 2, action }
    })

    failAction({}, h, {})

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload,
      projectName,
      backLink,
      cancelLink,
      siteNumber: 2,
      action
    })
  })

  test('spreads params into the view context when errors are present', () => {
    const cancelLink = '/cancel'

    failAction = createFailAction({
      viewRoute,
      settings,
      errorMessages,
      projectName,
      backLink,
      payload,
      params: { cancelLink }
    })

    const err = {
      details: [{ path: ['field'], message: 'REQUIRED', type: 'string.empty' }]
    }

    failAction({}, h, err)

    expect(h.view).toHaveBeenCalledWith(
      viewRoute,
      expect.objectContaining({ cancelLink })
    )
  })
})
