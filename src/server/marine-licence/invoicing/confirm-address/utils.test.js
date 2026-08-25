import {
  buildAddressLines,
  buildStreetLine,
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
    ['blank fields', { buildingName: '  ', street: 'QUAYSIDE' }, 'QUAYSIDE']
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

  test('Should leave the optional fields undefined when the lookup omits them', () => {
    expect(
      toInvoiceAddress({
        buildingNumber: '1',
        street: 'QUAYSIDE',
        town: 'NEWCASTLE UPON TYNE',
        postcode: 'NE1 1EE'
      })
    ).toEqual({
      addressLine1: '1 QUAYSIDE',
      addressLine2: undefined,
      addressTown: 'NEWCASTLE UPON TYNE',
      addressCounty: undefined,
      addressPostcode: 'NE1 1EE'
    })
  })
})
