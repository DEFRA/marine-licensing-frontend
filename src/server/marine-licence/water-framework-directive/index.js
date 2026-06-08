import { waterFrameworkDirectiveBeforeYouStartRoutes } from '#src/server/marine-licence/water-framework-directive/before-you-start/index.js'
import { waterFrameworkDirectiveNauticalMileRoutes } from '#src/server/marine-licence/water-framework-directive/nautical-mile/index.js'

export const waterDirectiveRoutes = [
  ...waterFrameworkDirectiveBeforeYouStartRoutes,
  ...waterFrameworkDirectiveNauticalMileRoutes
]
