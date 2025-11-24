import { useCallback, useRef, useState } from 'react'
import { PublicKey, type Connection } from '@solana/web3.js'
import { StreamflowDistributorSolana } from '@streamflow/distributor'
import BN from 'bn.js'
import { formatAmountFromBN } from '../utils/format'
import { appConfig } from '../config'
import type { DistributorAccountLike, DistributorClient } from '../utils/streamflowDistributor'

export type AirdropDetails = {
  id: string
  tokenMint: string
  tokenDecimals: number
  type: 'Vested' | 'Instant'
  recipientsClaimed: number
  recipientsTotal: number
  amountClaimed: string
  amountTotal: string
  start: number
  end: number
}

export type ProofApiResponse = {
  amountUnlocked: string | number
  amountLocked: string | number
  proof: number[][]
}

export type ClaimStatus = {
  proof?: number[][]
  amountUnlocked?: BN
  amountLocked?: BN
  claimableAmount?: BN
  [key: string]: unknown
}

export type UseAirdropDetailsResult = {
  airdropDetails: AirdropDetails | null
  claimableAmount: string
  numericClaimable: number
  claimStatus: ClaimStatus | null
  isLoading: boolean
  error: string | null
  fetchById: (id: string) => Promise<void>
  refreshClaimable: () => Promise<void>
  setError: (message: string | null) => void
}

export const useAirdropDetails = (
  connection: Connection | null,
  publicKey: PublicKey | null,
  distributorClient: DistributorClient | null,
): UseAirdropDetailsResult => {
  const [airdropDetails, setAirdropDetails] = useState<AirdropDetails | null>(null)
  const [claimableAmount, setClaimableAmount] = useState<string>('0')
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastFetchedRef = useRef<{ id: string; wallet: string | null } | null>(null)
  const proofCacheRef = useRef<Record<string, ProofApiResponse | null>>({})

  const numericClaimable = Number(claimableAmount.replace(/,/g, '')) || 0

  const fetchProofFromApi = useCallback(
    async (distributorId: string, walletAddress: string): Promise<ProofApiResponse | null> => {
      const cacheKey = `${distributorId}:${walletAddress}`

      if (proofCacheRef.current[cacheKey]) {
        return proofCacheRef.current[cacheKey]
      }

      try {
        const url = `${appConfig.streamflowApiBase}/v2/api/airdrops/${distributorId}/claimants/${walletAddress}?chain=${appConfig.streamflowChain}&cluster=${appConfig.streamflowCluster}`
        console.log('Fetching proof from:', url)

        const response = await fetch(url)
        if (!response.ok) return null

        const data = (await response.json()) as ProofApiResponse
        proofCacheRef.current[cacheKey] = data
        return data
      } catch (e) {
        console.error('Error fetching proof:', e)
        return null
      }
    },
    [],
  )

  const updateClaimableForUser = useCallback(
    async (details: AirdropDetails) => {
      if (!distributorClient || !connection || !publicKey) {
        setClaimableAmount('0')
        setClaimStatus(null)
        return
      }

      try {
        const distributorProgramId = distributorClient.getDistributorProgramId()
        const distributorPubkey = new PublicKey(details.id)

        const claimStatusPda = StreamflowDistributorSolana.getClaimantStatusPda(
          distributorProgramId,
          distributorPubkey,
          publicKey,
        )

        const status = (await distributorClient.getClaim(claimStatusPda)) as ClaimStatus | null

        if (status) {
          const rawClaimable = status.claimableAmount

          if (rawClaimable) {
            setClaimableAmount(formatAmountFromBN(rawClaimable, details.tokenDecimals))
            setClaimStatus(status)
            return
          }

          console.log(
            'On-chain claim status exists but has no top-level `claimableAmount`. Falling back to API.',
          )
        }

        const apiData = await fetchProofFromApi(details.id, publicKey.toBase58())
        if (apiData) {
          const unlocked = new BN(apiData.amountUnlocked)
          const locked = new BN(apiData.amountLocked)
          const total = unlocked.add(locked)

          setClaimableAmount(formatAmountFromBN(total, details.tokenDecimals))

          setClaimStatus({
            proof: apiData.proof,
            amountUnlocked: unlocked,
            amountLocked: locked,
            claimableAmount: total,
          })
        } else {
          setClaimableAmount('0')
          setClaimStatus(null)
        }
      } catch (err) {
        console.error(err)
        setClaimableAmount('0')
        setClaimStatus(null)
      }
    },
    [connection, distributorClient, fetchProofFromApi, publicKey],
  )

  const fetchAirdropDetails = useCallback(
    async (id: string): Promise<AirdropDetails> => {
      if (!distributorClient || !connection) throw new Error('Distributor client not ready.')

      const [distributor] = await distributorClient.getDistributors({ ids: [id] })
      if (!distributor) throw new Error('Airdrop not found.')

      const d = distributor as unknown as DistributorAccountLike
      const mintPubkey = new PublicKey(d.mint as string)

      const supply = await connection.getTokenSupply(mintPubkey)
      if (!supply.value) throw new Error('Invalid token mint data.')

      const decimals = supply.value.decimals

      const start = d.startTs?.toNumber?.() ?? 0
      const end = d.endTs?.toNumber?.() ?? 0
      const isVested = end > start && (d.unlockPeriod?.toNumber?.() ?? 0) > 0

      return {
        id,
        tokenMint: mintPubkey.toBase58(),
        tokenDecimals: decimals,
        type: isVested ? 'Vested' : 'Instant',
        recipientsClaimed: d.numNodesClaimed?.toNumber?.() ?? 0,
        recipientsTotal: d.maxNumNodes?.toNumber?.() ?? 0,
        amountClaimed: formatAmountFromBN(d.totalAmountClaimed, decimals),
        amountTotal: formatAmountFromBN(d.maxTotalClaim, decimals),
        start,
        end,
      }
    },
    [connection, distributorClient],
  )

  const fetchById = useCallback(
    async (id: string) => {
      try {
        const currentWallet = publicKey?.toBase58() ?? null

        if (
          lastFetchedRef.current &&
          lastFetchedRef.current.id === id &&
          lastFetchedRef.current.wallet === currentWallet &&
          airdropDetails &&
          claimStatus
        ) {
          return
        }

        setIsLoading(true)
        setError(null)

        // Basic validation
        new PublicKey(id)

        const details = await fetchAirdropDetails(id)
        setAirdropDetails(details)
        await updateClaimableForUser(details)

        lastFetchedRef.current = { id, wallet: currentWallet }
      } catch (e) {
        console.error(e)
        setError('Failed to fetch airdrop details. Please check the ID.')
        setAirdropDetails(null)
        setClaimableAmount('0')
        setClaimStatus(null)
      } finally {
        setIsLoading(false)
      }
    },
    [airdropDetails, claimStatus, fetchAirdropDetails, publicKey, updateClaimableForUser],
  )

  const refreshClaimable = useCallback(async () => {
    if (!airdropDetails) return
    await updateClaimableForUser(airdropDetails)
  }, [airdropDetails, updateClaimableForUser])

  return {
    airdropDetails,
    claimableAmount,
    numericClaimable,
    claimStatus,
    isLoading,
    error,
    fetchById,
    refreshClaimable,
    setError,
  }
}


