import { getNumberFromBN } from '@streamflow/stream'

export const formatAmountFromBN = (raw: any, decimals: number): string => {
  try {
    const value = getNumberFromBN(raw, decimals)
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })
  } catch {
    return '0'
  }
}
