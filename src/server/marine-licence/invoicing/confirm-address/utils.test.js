import {
  buildAddressLines,
  buildStreetLine,
  hasRenderableAddress,
  toInvoiceAddress
} from '#src/server/marine-licence/invoicing/confirm-address/utils.js'

const fullResult = {
  subBuildingName: 'FLAT 3',
  buildingName: 'TYNESIDE HOUSE',
  buildingNumber: '116',
  street: 'SKINNERBURN ROAD',
  locality: 'NEWCASTLE BUSINESS PARK',
  town: 'NEWCASTLE UPON TYNE',
  ceremonialCounty: 'TYNE & WEAR',
  postcode: 'NE4 7AR'
}

describe('#buildStreetLine', () => {
  test('Should join every provided field with a single space', () => {
    expect(buildStreetLine(fullResult)).toBe(
      'FLAT 3 TYNESIDE HOUSE 116 SKINNERBURN ROAD'
    )
  })

  test.each([
    [
      'no sub building name',
      { buildingName: 'TYNESIDE HOUSE', street: 'SKINNERBURN ROAD' },
      'TYNESIDE HOUSE SKINNERBURN ROAD'
    ],
    [
      'a building number instead of a name',
      { buildingNumber: '1', street: 'QUAYSIDE' },
      '1 QUAYSIDE'
    ],
    ['only a street', { street: 'QUAYSIDE' }, 'QUAYSIDE'],
    ['blank fields', { buildingName: '  ', street: 'QUAYSIDE' }, 'QUAYSIDE'],
    [
      'a field that arrives as a number rather than a string',
      { buildingNumber: 1, street: 'QUAYSIDE' },
      '1 QUAYSIDE'
    ]
  ])('Should handle %s', (_name, result, expected) => {
    expect(buildStreetLine(result)).toBe(expected)
  })

  test('Should be empty when there is nothing to show', () => {
    expect(buildStreetLine({})).toBe('')
  })
})

describe('#buildAddressLines', () => {
  test('Should list the street line, locality, town, county and postcode', () => {
    expect(buildAddressLines(fullResult)).toEqual([
      'FLAT 3 TYNESIDE HOUSE 116 SKINNERBURN ROAD',
      'NEWCASTLE BUSINESS PARK',
      'NEWCASTLE UPON TYNE',
      'TYNE & WEAR',
      'NE4 7AR'
    ])
  })

  test('Should omit the fields the lookup did not provide', () => {
    expect(
      buildAddressLines({
        buildingNumber: '1',
        street: 'QUAYSIDE',
        town: 'NEWCASTLE UPON TYNE',
        postcode: 'NE1 1EE'
      })
    ).toEqual(['1 QUAYSIDE', 'NEWCASTLE UPON TYNE', 'NE1 1EE'])
  })
})

describe('#hasRenderableAddress', () => {
  test('Should be true when there is at least one line to show', () => {
    expect(hasRenderableAddress({ postcode: 'NE1 1EE' })).toBe(true)
  })

  test.each([
    ['there is no result', undefined],
    ['the result is empty', {}],
    ['every field is blank', { street: '  ', town: '', postcode: undefined }]
  ])('Should be false when %s', (_name, result) => {
    expect(hasRenderableAddress(result)).toBe(false)
  })
})

describe('#toInvoiceAddress', () => {
  test('Should map the lookup fields onto the manual entry address structure', () => {
    expect(toInvoiceAddress(fullResult)).toEqual({
      addressLine1: 'FLAT 3 TYNESIDE HOUSE 116 SKINNERBURN ROAD',
      addressLine2: 'NEWCASTLE BUSINESS PARK',
      addressTown: 'NEWCASTLE UPON TYNE',
      addressCounty: 'TYNE & WEAR',
      addressPostcode: 'NE4 7AR'
    })
  })

  test('Should leave the optional fields empty when the lookup omits them', () => {
    expect(
      toInvoiceAddress({
        buildingNumber: '1',
        street: 'QUAYSIDE',
        town: 'NEWCASTLE UPON TYNE',
        postcode: 'NE1 1EE'
      })
    ).toEqual({
      addressLine1: '1 QUAYSIDE',
      addressLine2: '',
      addressTown: 'NEWCASTLE UPON TYNE',
      addressCounty: '',
      addressPostcode: 'NE1 1EE'
    })
  })
})
