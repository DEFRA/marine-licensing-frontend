import { ACTIVITY_LABELS } from '#src/server/common/constants/activities.js'

const getConstructionActivities = () => [
  { divider: 'Aquaculture' },
  { text: ACTIVITY_LABELS.CON1, value: 'CON1' },
  { text: ACTIVITY_LABELS.CON2, value: 'CON2' },
  { divider: 'Coastal defence works' },
  { text: ACTIVITY_LABELS.CON3, value: 'CON3' },
  { text: ACTIVITY_LABELS.CON4, value: 'CON4' },
  { divider: 'Coastal or shore-based structures' },
  { text: ACTIVITY_LABELS.CON5, value: 'CON5' },
  { text: ACTIVITY_LABELS.CON6, value: 'CON6' },
  { text: ACTIVITY_LABELS.CON7, value: 'CON7' },
  { text: ACTIVITY_LABELS.CON8, value: 'CON8' },
  { text: ACTIVITY_LABELS.CON9, value: 'CON9' },
  { text: ACTIVITY_LABELS.CON10, value: 'CON10' },
  { text: ACTIVITY_LABELS.CON11, value: 'CON11' },
  { text: ACTIVITY_LABELS.CON12, value: 'CON12' },
  { divider: 'Floating or part-floating structures (fixed in place)' },
  { text: ACTIVITY_LABELS.CON13, value: 'CON13' },
  { text: ACTIVITY_LABELS.CON14, value: 'CON14' },
  { divider: 'Marine energy structures' },
  { text: ACTIVITY_LABELS.CON15, value: 'CON15' },
  { text: ACTIVITY_LABELS.CON16, value: 'CON16' },
  { text: ACTIVITY_LABELS.CON17, value: 'CON17' },
  { divider: 'Marine utilities and infrastructure' },
  { text: ACTIVITY_LABELS.CON18, value: 'CON18' },
  { text: ACTIVITY_LABELS.CON19, value: 'CON19' },
  { text: ACTIVITY_LABELS.CON20, value: 'CON20' },
  { text: ACTIVITY_LABELS.CON21, value: 'CON21' },
  { text: ACTIVITY_LABELS.CON22, value: 'CON22' },
  { divider: 'Seabed-fixed structures' },
  { text: ACTIVITY_LABELS.CON23, value: 'CON23' },
  { text: ACTIVITY_LABELS.CON24, value: 'CON24' },
  { text: ACTIVITY_LABELS.CON25, value: 'CON25' },
  { divider: 'Other structures' },
  { text: ACTIVITY_LABELS.CON_OTHER, value: 'other' }
]

const getDepositActivities = () => [
  { divider: 'Dredged material and waste' },
  { text: ACTIVITY_LABELS.DEP1, value: 'DEP1' },
  { text: ACTIVITY_LABELS.DEP2, value: 'DEP2' },
  { text: ACTIVITY_LABELS.DEP3, value: 'DEP3' },
  { text: ACTIVITY_LABELS.DEP4, value: 'DEP4' },
  { text: ACTIVITY_LABELS.DEP5, value: 'DEP5' },
  { text: ACTIVITY_LABELS.DEP6, value: 'DEP6' },
  { divider: 'Equipment, structures and installations' },
  { text: ACTIVITY_LABELS.DEP7, value: 'DEP7' },
  { text: ACTIVITY_LABELS.DEP8, value: 'DEP8' },
  { text: ACTIVITY_LABELS.DEP9, value: 'DEP9' },
  { text: ACTIVITY_LABELS.DEP10, value: 'DEP10' },
  { text: ACTIVITY_LABELS.DEP11, value: 'DEP11' },
  { text: ACTIVITY_LABELS.DEP12, value: 'DEP12' },
  { text: ACTIVITY_LABELS.DEP13, value: 'DEP13' },
  { text: ACTIVITY_LABELS.DEP14, value: 'DEP14' },
  { divider: 'Environmental enhancement and restoration' },
  { text: ACTIVITY_LABELS.DEP15, value: 'DEP15' },
  { text: ACTIVITY_LABELS.DEP16, value: 'DEP16' },
  { text: ACTIVITY_LABELS.DEP17, value: 'DEP17' },
  { divider: 'Hazardous, controlled or sensitive deposits' },
  { text: ACTIVITY_LABELS.DEP18, value: 'DEP18' },
  { text: ACTIVITY_LABELS.DEP19, value: 'DEP19' },
  { text: ACTIVITY_LABELS.DEP20, value: 'DEP20' },
  { text: ACTIVITY_LABELS.DEP21, value: 'DEP21' },
  { divider: 'Other substances or objects' },
  { text: ACTIVITY_LABELS.DEP_OTHER, value: 'other' }
]

const getRemovalActivities = () => [
  { divider: 'Debris, waste or abandoned items' },
  { text: ACTIVITY_LABELS.REM1, value: 'REM1' },
  { text: ACTIVITY_LABELS.REM2, value: 'REM2' },
  { text: ACTIVITY_LABELS.REM3, value: 'REM3' },
  { divider: 'Decommissioning – structures' },
  { text: ACTIVITY_LABELS.REM4, value: 'REM4' },
  { text: ACTIVITY_LABELS.REM5, value: 'REM5' },
  { text: ACTIVITY_LABELS.REM6, value: 'REM6' },
  { text: ACTIVITY_LABELS.REM7, value: 'REM7' },
  { text: ACTIVITY_LABELS.REM8, value: 'REM8' },
  { text: ACTIVITY_LABELS.REM9, value: 'REM9' },
  { text: ACTIVITY_LABELS.REM10, value: 'REM10' },
  { text: ACTIVITY_LABELS.REM11, value: 'REM11' },
  { text: ACTIVITY_LABELS.REM12, value: 'REM12' },
  { text: ACTIVITY_LABELS.REM13, value: 'REM13' },
  { text: ACTIVITY_LABELS.REM14, value: 'REM14' },
  { text: ACTIVITY_LABELS.REM15, value: 'REM15' },
  { text: ACTIVITY_LABELS.REM16, value: 'REM16' },
  { divider: 'Decommissioning – components and equipment' },
  { text: ACTIVITY_LABELS.REM17, value: 'REM17' },
  { text: ACTIVITY_LABELS.REM18, value: 'REM18' },
  { text: ACTIVITY_LABELS.REM19, value: 'REM19' },
  { text: ACTIVITY_LABELS.REM20, value: 'REM20' },
  { text: ACTIVITY_LABELS.REM21, value: 'REM21' },
  { text: ACTIVITY_LABELS.REM22, value: 'REM22' },
  { text: ACTIVITY_LABELS.REM23, value: 'REM23' },
  { text: ACTIVITY_LABELS.REM24, value: 'REM24' },
  { text: ACTIVITY_LABELS.REM25, value: 'REM25' },
  { text: ACTIVITY_LABELS.REM26, value: 'REM26' },
  { text: ACTIVITY_LABELS.REM27, value: 'REM27' },
  { divider: 'Deposited objects' },
  { text: ACTIVITY_LABELS.REM28, value: 'REM28' },
  { text: ACTIVITY_LABELS.REM29, value: 'REM29' },
  { text: ACTIVITY_LABELS.REM30, value: 'REM30' },
  { text: ACTIVITY_LABELS.REM31, value: 'REM31' },
  { text: ACTIVITY_LABELS.REM32, value: 'REM32' },
  { text: ACTIVITY_LABELS.REM33, value: 'REM33' },
  { divider: 'Items of historical interest' },
  { text: ACTIVITY_LABELS.REM34, value: 'REM34' },
  { divider: 'Research' },
  { text: ACTIVITY_LABELS.REM35, value: 'REM35' },
  { divider: 'Other substances or objects' },
  { text: ACTIVITY_LABELS.REM_OTHER, value: 'other' }
]

export const getActivityOptions = (activityType) => {
  if (activityType === 'construction') {
    return getConstructionActivities()
  }

  if (activityType === 'deposit') {
    return getDepositActivities()
  }

  if (activityType === 'removal') {
    return getRemovalActivities()
  }

  return []
}
