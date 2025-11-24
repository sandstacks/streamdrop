import { useCallback, useEffect, useState } from 'react'
import type {
  SimplifiedAirdrop,
  DistributorLike,
  DistributorClient,
} from '../utils'

export type UseAirdropListResult = {
  airdrops: SimplifiedAirdrop[]
  isLoading: boolean
}

export const useAirdropList = (
  distributorClient: DistributorClient | null,
): UseAirdropListResult => {
  const [airdrops, setAirdrops] = useState<SimplifiedAirdrop[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAllAirdrops = useCallback(async () => {
    if (!distributorClient) return
    try {
      setIsLoading(true)
      const distributors = (await distributorClient.searchDistributors({})) as DistributorLike[]
      const { mapDistributorsToAirdrops } = await import('../utils')
      const mapped = mapDistributorsToAirdrops(distributors)
      setAirdrops(mapped)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [distributorClient])

  useEffect(() => {
    if (!distributorClient) return
    void fetchAllAirdrops()
  }, [distributorClient, fetchAllAirdrops])

  return {
    airdrops,
    isLoading,
  }
}
