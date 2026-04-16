import { typeOfActivitySchema } from '#src/server/marine-licence/site-details/type-of-activity/schema.js'

describe('#typeOfActivitySchema', () => {
  test.each([
    ['construction', 'activitySubTypeConstruction', 'construction-type-1'],
    ['construction', 'activitySubTypeConstruction', 'construction-type-2'],
    ['construction', 'activitySubTypeConstruction', 'construction-type-3'],
    ['deposit', 'activitySubTypeDeposit', 'deposit-type-1'],
    ['deposit', 'activitySubTypeDeposit', 'deposit-type-2'],
    ['deposit', 'activitySubTypeDeposit', 'deposit-type-3'],
    ['removal', 'activitySubTypeRemoval', 'removal-type-1'],
    ['removal', 'activitySubTypeRemoval', 'removal-type-2'],
    ['removal', 'activitySubTypeRemoval', 'removal-type-3'],
    ['removal', 'activitySubTypeRemoval', 'removal-type-4']
  ])(
    'accepts %s with subtype %s',
    (activityType, subtypeField, subtypeValue) => {
      const { error } = typeOfActivitySchema.validate({
        activityType,
        [subtypeField]: subtypeValue
      })
      expect(error).toBeUndefined()
    }
  )

  test('fails when activityType is missing', () => {
    const { error } = typeOfActivitySchema.validate({
      activitySubTypeConstruction: 'construction-type-1'
    })
    expect(error?.message).toBe('ACTIVITY_TYPE_REQUIRED')
  })

  test('fails when activityType is invalid', () => {
    const { error } = typeOfActivitySchema.validate({
      activityType: 'other',
      activitySubTypeConstruction: 'construction-type-1'
    })
    expect(error?.message).toBe('ACTIVITY_TYPE_REQUIRED')
  })

  test.each([
    ['construction', 'ACTIVITY_TYPE_CONSTRUCTION_REQUIRED'],
    ['deposit', 'ACTIVITY_TYPE_DEPOSIT_REQUIRED'],
    ['removal', 'ACTIVITY_TYPE_REMOVAL_REQUIRED']
  ])(
    'fails when activityType is %s but subtype is omitted',
    (activityType, expectedKey) => {
      const { error } = typeOfActivitySchema.validate({ activityType })
      expect(error.message).toBe(expectedKey)
    }
  )

  test.each([
    [
      'construction',
      'activitySubTypeConstruction',
      'deposit-type-1',
      'ACTIVITY_TYPE_CONSTRUCTION_REQUIRED'
    ],
    [
      'deposit',
      'activitySubTypeDeposit',
      'removal-type-1',
      'ACTIVITY_TYPE_DEPOSIT_REQUIRED'
    ],
    [
      'removal',
      'activitySubTypeRemoval',
      'construction-type-1',
      'ACTIVITY_TYPE_REMOVAL_REQUIRED'
    ]
  ])(
    'fails when subtype does not match activityType %s',
    (activityType, subtypeField, invalidValue, expectedKey) => {
      const { error } = typeOfActivitySchema.validate({
        activityType,
        [subtypeField]: invalidValue
      })
      expect(error?.message).toBe(expectedKey)
    }
  )

  test('does not require subtype when activityType is absent', () => {
    const { error } = typeOfActivitySchema.validate({})
    expect(error?.message).toBe('ACTIVITY_TYPE_REQUIRED')
  })
})
