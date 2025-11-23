import { useEffect, useMemo, useRef, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { StreamflowDistributorSolana } from '@streamflow/distributor'
import { BN } from 'bn.js'
import { formatAmountFromBN } from '../utils/format'
import { createDistributorClient, mapDistributorsToAirdrops } from '../utils/streamflowDistributor'
import type { SimplifiedAirdrop } from '../utils/streamflowDistributor'
import { RecentAirdropsList } from './RecentAirdropsList'
import { AirdropDetailsSection } from './AirdropDetailsSection'
import { appConfig } from '../config'

export const AirdropClaimer = () => {
  const { connection } = useConnection()
  const { publicKey, wallet } = useWallet()

  const [airdropId, setAirdropId] = useState('')
  const [airdropDetails, setAirdropDetails] = useState<any | null>(null)
  const [availableAirdrops, setAvailableAirdrops] = useState<SimplifiedAirdrop[]>([])
  const [isAirdropListLoading, setIsAirdropListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [claimableAmount, setClaimableAmount] = useState<string>('0')
  const [isClaiming, setIsClaiming] = useState(false)
  
  const [claimStatus, setClaimStatus] = useState<any | null>(null)

  const numericClaimable = Number(claimableAmount.replace(/,/g, '')) || 0

  // Cache last fetched airdrop for current wallet to avoid duplicate fetches
  const lastFetchedRef = useRef<{ id: string; wallet: string | null } | null>(null)

  // Cache proofs/claim data per (airdropId, wallet) to avoid repeated API hits
  const proofCacheRef = useRef<Record<string, any>>({})

  const distributorClient = useMemo(
    () => createDistributorClient(connection),
    [connection],
  )

  const fetchProofFromApi = async (distributorId: string, walletAddress: string) => {
    const cacheKey = `${distributorId}:${walletAddress}`

    // 1. Return cached data if available
    if (proofCacheRef.current[cacheKey]) {
      return proofCacheRef.current[cacheKey]
    }

    // 2. Fallback to API
    try {
      const url = `${appConfig.streamflowApiBase}/v2/api/airdrops/${distributorId}/claimants/${walletAddress}?chain=${appConfig.streamflowChain}&cluster=${appConfig.streamflowCluster}`
      console.log('Fetching proof from:', url)

      const response = await fetch(url)
      if (!response.ok) return null

      const data = await response.json()
      proofCacheRef.current[cacheKey] = data
      return data
    } catch (e) {
      console.error('Error fetching proof:', e)
      return null
    }
  }

  const updateClaimableForUser = async (details: { id: string; tokenDecimals: number }) => {
    if (!distributorClient) console.log("Distributer client is absent")
    if (!publicKey) console.log("Public key is absent")
    if (!connection) console.log("Connection is absent")
    if (!distributorClient || !connection || !publicKey) {
      setClaimableAmount('0')
      setClaimStatus(null)
      return
    }

    try {
      const distributorProgramId = distributorClient.getDistributorProgramId()
      const distributorPubkey = new PublicKey(details.id)

      // 1. Check On-Chain Status First
      const claimStatusPda = StreamflowDistributorSolana.getClaimantStatusPda(
        distributorProgramId,
        distributorPubkey,
        publicKey,
      )
      
      const status = await distributorClient.getClaim(claimStatusPda)
      console.log('STATUS:', status)
      console.log('CLAIM STATUS PDA:', claimStatusPda)
      console.log('DISTRIBUTOR PROGRAM ID:', distributorProgramId)
      console.log('DISTRIBUTOR PUBKEY:', distributorPubkey)
      console.log('PUBLIC KEY:', publicKey)

      if (status) {
        // Some distributions may create claim status accounts early (before claim).
        // If the structure does not expose `claimableAmount` at the top level,
        // we treat it as "no usable on-chain amount yet" and fall back to the API.
        const rawClaimable = (status as any).claimableAmount

        if (rawClaimable) {
          console.log('On-chain claimable amount found:', rawClaimable.toString())
          setClaimableAmount(formatAmountFromBN(rawClaimable, details.tokenDecimals))
          setClaimStatus(status)
          return
        }

        console.log(
          'On-chain claim status exists but has no top-level `claimableAmount`. Falling back to API.',
        )
      }

      // If no on-chain status or no usable claimable field, check API for eligibility info
      const apiData = await  fetchProofFromApi(details.id, publicKey.toBase58())
      console.log('API DATA:', apiData)
      if (apiData) {
        const unlocked = new BN(apiData.amountUnlocked)
        const locked = new BN(apiData.amountLocked)
        const total = unlocked.add(locked)

        console.log('UNLOCKED:', unlocked.toString())
        console.log('LOCKED:', locked.toString())
        console.log('TOTAL:', total.toString())

        setClaimableAmount(formatAmountFromBN(total, details.tokenDecimals))

        // Save data for handleClaim
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
  }

  const fetchAirdropDetails = async (id: string) => {
    if (!distributorClient) throw new Error('Distributor client not ready.')

    const [distributor] = await distributorClient.getDistributors({ ids: [id] })
    if (!distributor) throw new Error('Airdrop not found.')

    const d: any = distributor
    const mintPubkey = new PublicKey(d.mint as string)
    
    const supply = await connection.getTokenSupply(mintPubkey)
    if (!supply.value) throw new Error('Invalid token mint data.')
    
    const decimals = supply.value.decimals

    const start = d.startTs.toNumber()
    const end = d.endTs.toNumber()
    const isVested = (end - start) > 0 && d.unlockPeriod.toNumber() > 0

    return {
      id,
      tokenMint: mintPubkey.toBase58(),
      tokenDecimals: decimals,
      type: isVested ? 'Vested' : 'Instant',
      recipientsClaimed: d.numNodesClaimed.toNumber(),
      recipientsTotal: d.maxNumNodes.toNumber(),
      amountClaimed: formatAmountFromBN(d.totalAmountClaimed, decimals),
      amountTotal: formatAmountFromBN(d.maxTotalClaim, decimals),
      start,
      end,
    }
  }

  const fetchAndSetAirdropDetails = async (id: string) => {
    try {
      const currentWallet = publicKey?.toBase58() ?? null

      // Avoid duplicate fetch if same airdrop & wallet and we already have data
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
  }

  const handleFetchDetails = async () => {
    if (!airdropId) {
      setError('Please enter an Airdrop ID.')
      return
    }
    await fetchAndSetAirdropDetails(airdropId)
  }

  const handleSelectAirdrop = async (id: string) => {
    setAirdropId(id)
    await fetchAndSetAirdropDetails(id)
  }

  const handleClaim = async () => {
    if (!distributorClient || !wallet?.adapter || !airdropDetails || !claimStatus) return

    try {
      setIsClaiming(true)
      
      // LOGIC FIX: Pass correct parameters to SDK
      const claimParams = {
        id: airdropDetails.id,
        proof: claimStatus.proof,
        amountUnlocked: claimStatus.amountUnlocked,
        amountLocked: claimStatus.amountLocked,
      }

      const result = await (distributorClient as any).claim(claimParams, {
        invoker: wallet.adapter,
      })

      alert(`Claim transaction sent!\nSignature: ${result.txId}`)
      await updateClaimableForUser(airdropDetails) 
    } catch (e) {
      console.error("Claim Failed:", e)
      alert('Failed to claim tokens. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    if (airdropDetails && publicKey) {
      updateClaimableForUser(airdropDetails)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey])

  // Fetch all airdrops once the distributor client is ready
  useEffect(() => {
    const fetchAllAirdrops = async () => {
      if (!distributorClient) return
      try {
        setIsAirdropListLoading(true)
        // Use searchDistributors with empty params to browse available airdrops
        const distributors: any[] = await (distributorClient as any).searchDistributors({})
        const mapped = mapDistributorsToAirdrops(distributors)
        setAvailableAirdrops(mapped)
      } catch (e) {
        console.error(e)
      } finally {
        setIsAirdropListLoading(false)
      }
    }

    if (distributorClient) {
      fetchAllAirdrops()
    }
  }, [distributorClient])

  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-soft-xl backdrop-blur sm:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
          Airdrop details & claim
        </h2>
        <p className="text-xs text-slate-400 sm:text-sm">
          Paste a Streamflow airdrop ID (distributor address) or pick one from the list below to see its parameters and your
          personal allocation.
        </p>
      </div>

      {/* Airdrop ID manual input */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Airdrop ID
          </label>
          <input
            type="text"
            placeholder="e.g. BcLcPoVMpf3sJZAKJSYyL4QRGj1mu63q3qhkrrWXUyrF"
            value={airdropId}
            onChange={(e) => setAirdropId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={handleFetchDetails}
          disabled={isLoading}
          className="mt-1 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-950/60 transition hover:bg-accent-soft sm:mt-6 sm:w-auto"
        >
          {isLoading ? 'Fetching…' : 'Fetch details'}
        </button>
      </div>

      {airdropDetails && (
        <AirdropDetailsSection
          details={airdropDetails}
          publicKey={publicKey}
          claimableAmount={claimableAmount}
          numericClaimable={numericClaimable}
          isLoading={isLoading}
          isClaiming={isClaiming}
          onClaim={handleClaim}
        />
      )}

      {/* Recent Airdrops list */}
      <RecentAirdropsList
        items={availableAirdrops}
        isLoading={isAirdropListLoading}
        selectedId={airdropDetails?.id}
        onSelect={handleSelectAirdrop}
      />

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200 sm:text-sm">
          {error}
        </p>
      )}

      
    </section>
  )
}