import {
  mapBackendErrorFields,
  toPublicRegister,
  toWithholdPayload
} from '#src/server/marine-licence/public-register/utils.js'

describe('#toWithholdPayload', () => {
  test.each([
    [
      { consent: 'no', reason: 'Some reason' },
      { withholdRequest: 'yes', withholdDetails: 'Some reason' }
    ],
    [{ consent: 'yes' }, { withholdRequest: 'no' }],
    [undefined, {}],
    [{}, {}]
  ])('maps %o to %o', (publicRegister, expected) => {
    expect(toWithholdPayload(publicRegister)).toEqual(expected)
  })
})

describe('#toPublicRegister', () => {
  test('maps a withhold request to a declined consent with a reason', () => {
    expect(
      toPublicRegister({
        withholdRequest: 'yes',
        withholdDetails: 'Some reason'
      })
    ).toEqual({ consent: 'no', reason: 'Some reason' })
  })

  test('maps no withhold request to a given consent without a reason', () => {
    expect(toPublicRegister({ withholdRequest: 'no' })).toEqual({
      consent: 'yes'
    })
  })

  test('drops details when no information is withheld', () => {
    expect(
      toPublicRegister({
        withholdRequest: 'no',
        withholdDetails: 'Some reason'
      })
    ).toEqual({ consent: 'yes' })
  })
})

describe('#mapBackendErrorFields', () => {
  test('renames consent and reason to the form field names', () => {
    expect(
      mapBackendErrorFields([
        { path: ['consent'], message: 'PUBLIC_REGISTER_CONSENT_REQUIRED' },
        { field: 'reason', message: 'PUBLIC_REGISTER_REASON_REQUIRED' }
      ])
    ).toEqual([
      {
        path: ['consent'],
        field: ['withholdRequest'],
        message: 'PUBLIC_REGISTER_CONSENT_REQUIRED'
      },
      { field: 'withholdDetails', message: 'PUBLIC_REGISTER_REASON_REQUIRED' }
    ])
  })

  test('leaves unrecognised fields untouched', () => {
    expect(mapBackendErrorFields([{ field: 'id', message: 'X' }])).toEqual([
      { field: 'id', message: 'X' }
    ])
  })
})
