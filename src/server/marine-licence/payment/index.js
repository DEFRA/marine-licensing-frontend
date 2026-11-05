import joi from 'joi'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  paymentRetryController,
  paymentReturnController
} from '#src/server/marine-licence/payment/controller.js'

const params = joi.object({
  returnId: joi.string().guid({ version: 'uuidv4' }).required()
})

export const paymentRoutes = [
  {
    method: 'GET',
    path: `${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETURN}/{returnId}`,
    options: { validate: { params } },
    ...paymentReturnController
  },
  {
    method: 'POST',
    path: `${marineLicenceRoutes.MARINE_LICENCE_PAYMENT_RETRY}/{returnId}`,
    options: { validate: { params } },
    ...paymentRetryController
  }
]
