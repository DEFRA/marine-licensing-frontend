import { purchaseOrderDetailsSchema } from '#src/server/common/validation/invoicing/purchase-order-details/schema.js'

describe('#purchaseOrderDetailsSchema', () => {
  test('should validate when requiresPurchaseOrder is no', () => {
    const { error } = purchaseOrderDetailsSchema.validate({
      requiresPurchaseOrder: 'no'
    })
    expect(error).toBeUndefined()
  })

  test('should validate when requiresPurchaseOrder is yes with a purchase order number', () => {
    const { error } = purchaseOrderDetailsSchema.validate({
      requiresPurchaseOrder: 'yes',
      purchaseOrderNumber: 'PO-12345'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = purchaseOrderDetailsSchema.validate({})
    expect(error.message).toBe('INVOICING_PURCHASE_ORDER_REQUIRED')
  })

  test('should fail on invalid requiresPurchaseOrder value', () => {
    const { error } = purchaseOrderDetailsSchema.validate({
      requiresPurchaseOrder: 'invalid'
    })
    expect(error.message).toBe('INVOICING_PURCHASE_ORDER_REQUIRED')
  })

  test('should fail when requiresPurchaseOrder is yes but purchaseOrderNumber is empty', () => {
    const { error } = purchaseOrderDetailsSchema.validate({
      requiresPurchaseOrder: 'yes',
      purchaseOrderNumber: ''
    })
    expect(error.message).toBe('INVOICING_PURCHASE_ORDER_NUMBER_REQUIRED')
  })

  test('should fail when purchaseOrderNumber exceeds 30 characters', () => {
    const { error } = purchaseOrderDetailsSchema.validate({
      requiresPurchaseOrder: 'yes',
      purchaseOrderNumber: 'a'.repeat(31)
    })
    expect(error.message).toBe('INVOICING_PURCHASE_ORDER_NUMBER_MAX_LENGTH')
  })

  test('should trim whitespace from purchaseOrderNumber', () => {
    const { error, value } = purchaseOrderDetailsSchema.validate({
      requiresPurchaseOrder: 'yes',
      purchaseOrderNumber: '  PO-12345  '
    })
    expect(error).toBeUndefined()
    expect(value.purchaseOrderNumber).toBe('PO-12345')
  })
})
