import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { createDistributorClient } from "../utils";
import { RecentAirdropsList } from "./RecentAirdropsList";
import { AirdropDetailsSection } from "./AirdropDetailsSection";
import { useAirdropDetails, useAirdropList } from "../hooks";
import { appConfig } from "../utils/config";

export const AirdropClaimer = () => {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();

  const [airdropId, setAirdropId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  const distributorClient = useMemo(
    () => createDistributorClient(connection),
    [connection]
  );

  const {
    airdropDetails,
    claimableAmount,
    numericClaimable,
    claimStatus,
    hasClaimed,
    isLoading,
    error: detailsError,
    fetchById,
    refreshClaimable,
  } = useAirdropDetails(connection, publicKey, distributorClient);

  const {
    airdrops: availableAirdrops,
    totalCount,
    hasMore,
    isLoading: isAirdropListLoading,
    loadMore
  } = useAirdropList(distributorClient);

  const handleFetchDetails = async () => {
    if (!airdropId) {
      setError("Please enter an Airdrop ID.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    await fetchById(airdropId);
  };

  const handleSelectAirdrop = async (id: string) => {
    setAirdropId(id);
    setError(null);
    await fetchById(id);
  };

  const handleClaim = async () => {
    if (
      !distributorClient ||
      !wallet?.adapter ||
      !airdropDetails ||
      !claimStatus ||
      !publicKey
    )
      return;

    try {
      setIsClaiming(true);

      const claimParams = {
        id: airdropDetails.id,
        proof: claimStatus.proof,
        amountUnlocked: claimStatus.amountUnlocked,
        amountLocked: claimStatus.amountLocked,
      };

      // Claim the airdrop
      const result = await distributorClient.claim(claimParams, {
        invoker: wallet.adapter,
      });

      const explorerUrl = `https://explorer.solana.com/tx/${result.txId}?cluster=devnet`;
      toast.success(
        () => (
          <div className="flex flex-col gap-1">
            <strong>Claim successful!</strong>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-xs break-all"
            >
              View transaction
            </a>
          </div>
        ),
        { duration: 10000 }
      );

      // Close the claim to reclaim rent if allowed
      if (airdropDetails.claimsClosableByClaimant) {
        try {
          await distributorClient.closeClaim(
            {
              ...claimParams,
              claimant: publicKey.toBase58(),
            },
            {
              invoker: wallet.adapter,
            }
          );
          toast.success("Claim closed successfully! Rent reclaimed.");
        } catch {
          // Non-critical error, just notify user
          toast("Note: Could not close claim to reclaim rent.", { icon: "ℹ️" });
        }
      }

      // Refresh user's claimable amount and airdrop overview stats
      await refreshClaimable();
      await fetchById(airdropDetails.id);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Failed to claim tokens: ${errorMessage}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const combinedError = error ?? detailsError;

  useEffect(() => {
    if (combinedError && !error) {
      errorRef.current?.focus();
    }
  }, [combinedError, error]);

  useEffect(() => {
    if (airdropDetails && publicKey) {
      void refreshClaimable();
    }
  }, [publicKey, airdropDetails, refreshClaimable]);

  return (
    <section
      className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-soft-xl backdrop-blur-sm sm:p-8"
      aria-busy={isLoading}
      aria-live="polite"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Airdrop Details & Claim
          </h2>
          <span className="hidden rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:inline-flex">
            {appConfig.streamflowChain} • {appConfig.streamflowCluster}
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Enter an airdrop ID or select one from the list below to view details and claim your allocation.
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-slate-950/60 p-4 sm:flex-row sm:items-end sm:gap-4 sm:p-5">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Airdrop ID
          </label>
          <input
            type="text"
            placeholder="e.g. BcLcPoVMpf3sJZAKJSYyL4QRGj1mu63q3qhkrrWXUyrF"
            value={airdropId}
            onChange={(e) => setAirdropId(e.target.value)}
            disabled={isLoading}
            ref={inputRef}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/40 disabled:text-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={handleFetchDetails}
          disabled={isLoading}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-950/60 transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6 sm:w-auto"
        >
          {isLoading && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/70 border-t-transparent" />
          )}
          <span>{isLoading ? "Fetching…" : "Fetch details"}</span>
        </button>
      </div>
      {airdropDetails && (
        <AirdropDetailsSection
          details={airdropDetails}
          publicKey={publicKey}
          claimableAmount={claimableAmount}
          numericClaimable={numericClaimable}
          hasClaimed={hasClaimed}
          isLoading={isLoading}
          isClaiming={isClaiming}
          onClaim={handleClaim}
        />
      )}
      <RecentAirdropsList
        items={availableAirdrops}
        totalCount={totalCount}
        hasMore={hasMore}
        isLoading={isAirdropListLoading}
        selectedId={airdropDetails?.id}
        onSelect={handleSelectAirdrop}
        onLoadMore={loadMore}
      />
      {combinedError && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200 outline-none sm:text-sm"
        >
          {combinedError}
        </p>
      )}
    </section>
  );
};
