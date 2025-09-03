export const requiredQueryParams = {
  ACTIVITY_TYPE: 'ACTIVITY_TYPE',
  ARTICLE: 'ARTICLE',
  pdfDownloadUrl: 'pdfDownloadUrl'
}

export const validActivitySubtypes = [
  'coastalProtectionDrainageOrFloodDefence',
  'crossrailAct',
  'deepseaMining',
  'defenceMiningCrossrail',
  'dredgedMaterial',
  'emergency',
  'fishing',
  'hullCleaning',
  'maintenance',
  'markersMooringsAidsToNavigation',
  'markersMooringsAndAidToNavigation',
  'miscellaneous',
  'navigationalDredging',
  'ObstructionsDanger',
  'pollutionResponse',
  'pontoons',
  'scientificResearch',
  'shellfish',
  'waste'
]

export const activityTypes = {
  CON: {
    value: 'CON',
    label: 'Construction'
  },
  DEPOSIT: {
    value: 'DEPOSIT',
    label: 'Deposit of a substance or object'
  },
  REMOVAL: {
    value: 'REMOVAL',
    label: 'Removal of a substance or object'
  },
  DREDGE: {
    value: 'DREDGE',
    label: 'Dredging'
  },
  INCINERATION: {
    value: 'INCINERATION',
    label: 'Incineration of a substance or object'
  },
  EXPLOSIVES: {
    value: 'EXPLOSIVES',
    label: 'Use of an explosive substance'
  },
  SCUTTLING: {
    value: 'SCUTTLING',
    label: 'Sinking of a vessel or floating container'
  }
}

export const articleCodes = [
  '13',
  '17',
  '17A',
  '17B',
  '18A',
  '20',
  '21',
  '25',
  '25A',
  '26A',
  '34',
  '35'
]
