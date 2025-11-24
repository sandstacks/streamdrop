import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { createDistributorClient } from '../utils/streamflowDistributor'
import { RecentAirdropsList } from './RecentAirdropsList'
import { AirdropDetailsSection } from './AirdropDetailsSection'
import { useAirdropDetails } from '../hooks/useAirdropDetails'
import { useAirdropList } from '../hooks/useAirdropList'

export const AirdropClaimer = () => {
  const { connection } = useConnection()
  const { publicKey, wallet } = useWallet()

  const [airdropId, setAirdropId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  const distributorClient = useMemo(
    () => createDistributorClient(connection),
    [connection],
  )

  const {
    airdropDetails,
    claimableAmount,
    numericClaimable,
    claimStatus,
    isLoading,
    error: detailsError,
    fetchById,
    refreshClaimable,
  } = useAirdropDetails(connection, publicKey, distributorClient)

  const { airdrops: availableAirdrops, isLoading: isAirdropListLoading } =
    useAirdropList(distributorClient)

  const handleFetchDetails = async () => {
    if (!airdropId) {
      setError('Please enter an Airdrop ID.')
      return
    }
    setError(null)
    await fetchById(airdropId)
  }

  const handleSelectAirdrop = async (id: string) => {
    setAirdropId(id)
    setError(null)
    await fetchById(id)
  }

  const handleClaim = async () => {
    if (!distributorClient || !wallet?.adapter || !airdropDetails || !claimStatus) return

    try {
      setIsClaiming(true)
      
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
      await refreshClaimable()
    } catch (e) {
      console.error("Claim Failed:", e)
      alert('Failed to claim tokens. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  const combinedError = error ?? detailsError

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

      <RecentAirdropsList
        items={availableAirdrops}
        isLoading={isAirdropListLoading}
        selectedId={airdropDetails?.id}
        onSelect={handleSelectAirdrop}
      />

      {combinedError && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200 sm:text-sm">
          {combinedError}
        </p>
      )}

      
    </section>
  )
}