import { vi, describe, test, expect, beforeEach } from 'vitest'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'

describe('createFailAction', () => {
  const viewRoute = 'some/view'
  const settings = { pageTitle: 'Title', heading: 'Heading' }
  const errorMessages = { REQUIRED: 'Field is required' }
  const projectName = 'My Project'
  const backLink = '/back'

  let getCache
  let getBackLink
  let h
  let failAction

  beforeEach(() => {
    getCache = vi.fn().mockReturnValue({ projectName })
    getBackLink = vi.fn().mockReturnValue(backLink)
    h = { view: vi.fn().mockReturnValue({ takeover: vi.fn() }) }
    failAction = createFailAction({
      getCache,
      viewRoute,
      settings,
      errorMessages,
      getBackLink
    })
  })

  test('renders view without errors when err.details is missing', () => {
    const request = { payload: { field: 'value' } }
    failAction(request, h, {})

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload: request.payload,
      projectName,
      backLink
    })
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('renders view without errors when err.details is null', () => {
    const request = { payload: { field: '' } }
    failAction(request, h, { details: null })

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload: request.payload,
      projectName,
      backLink
    })
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('renders view with mapped errors when err.details is present', () => {
    const request = { payload: { field: '' } }
    const err = {
      details: [{ path: ['field'], message: 'REQUIRED', type: 'string.empty' }]
    }

    failAction(request, h, err)

    expect(h.view).toHaveBeenCalledWith(viewRoute, {
      ...settings,
      payload: request.payload,
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
    const request = { payload: {} }
    const err = {
      details: [
        { path: ['field'], message: 'some.raw.message', type: 'any.required' }
      ]
    }

    failAction(request, h, err)

    expect(h.view).toHaveBeenCalledWith(
      viewRoute,
      expect.objectContaining({
        errorSummary: [
          { href: '#field', text: 'some.raw.message', field: ['field'] }
        ]
      })
    )
  })

  test('calls getCache and getBackLink with the request', () => {
    const request = { payload: {} }
    failAction(request, h, {})

    expect(getCache).toHaveBeenCalledWith(request)
    expect(getBackLink).toHaveBeenCalledWith(request)
  })
})
