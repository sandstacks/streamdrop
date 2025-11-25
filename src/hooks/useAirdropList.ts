import { useCallback, useEffect, useState } from "react";
import type {
  SimplifiedAirdrop,
  DistributorLike,
  DistributorClient,
} from "../utils";

const INITIAL_LOAD = 10;
const LOAD_MORE_INCREMENT = 10;

export type UseAirdropListResult = {
  airdrops: SimplifiedAirdrop[];
  allAirdrops: SimplifiedAirdrop[];
  displayedCount: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
};

export const useAirdropList = (
  distributorClient: DistributorClient | null
): UseAirdropListResult => {
  const [allAirdrops, setAllAirdrops] = useState<SimplifiedAirdrop[]>([]);
  const [displayedCount, setDisplayedCount] = useState(INITIAL_LOAD);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllAirdrops = useCallback(async () => {
    if (!distributorClient) return;
    try {
      setIsLoading(true);
      const distributors = (await distributorClient.searchDistributors(
        {}
      )) as DistributorLike[];
      const { mapDistributorsToAirdrops } = await import("../utils");
      const mapped = mapDistributorsToAirdrops(distributors);
      setAllAirdrops(mapped);
      setDisplayedCount(INITIAL_LOAD);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [distributorClient]);

  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => prev + LOAD_MORE_INCREMENT);
  }, []);

  useEffect(() => {
    if (!distributorClient) return;
    void fetchAllAirdrops();
  }, [distributorClient, fetchAllAirdrops]);

  const airdrops = allAirdrops.slice(0, displayedCount);
  const hasMore = displayedCount < allAirdrops.length;

  return {
    airdrops,
    allAirdrops,
    displayedCount,
    totalCount: allAirdrops.length,
    hasMore,
    isLoading,
    loadMore,
  };
};
