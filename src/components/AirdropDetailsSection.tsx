import { useEffect, useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import type { AirdropDetails } from "../hooks";
import {
  fetchJupiterTokenPrices,
  formatUsdForTokenAmount,
  type TokenPriceMap,
} from "../utils/jupiterPrice";

type Props = {
  details: AirdropDetails;
  publicKey: PublicKey | null;
  claimableAmount: string;
  numericClaimable: number;
  hasClaimed: boolean;
  isLoading: boolean;
  isClaiming: boolean;
  onClaim: () => void;
};

export const AirdropDetailsSection = ({
  details,
  publicKey,
  claimableAmount,
  numericClaimable,
  hasClaimed,
  isLoading,
  isClaiming,
  onClaim,
}: Props) => {
  const [tokenPrices, setTokenPrices] = useState<TokenPriceMap>({});
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  const recipientProgress =
    details.recipientsTotal > 0
      ? Math.min(
          100,
          (details.recipientsClaimed / details.recipientsTotal) * 100
        )
      : 0;

  useEffect(() => {
    const fetchPrices = async () => {
      if (!details.tokenMint) return;

      setIsPriceLoading(true);
      try {
        const prices = await fetchJupiterTokenPrices([details.tokenMint]);
        setTokenPrices(prices);
      } catch (error) {
        // Silently fail - USD display is optional
        console.error(error);
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchPrices();
  }, [details.tokenMint]);

  return (
    <div className="mt-2 grid gap-4 sm:grid-cols-[2fr,1.3fr]">
      <div className="space-y-3 rounded-xl border border-slate-800 bg-surfaceAlt/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100">
            Airdrop overview
          </h3>
          <span className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300">
            {details.type}
          </span>
        </div>

        <dl className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-300 sm:text-sm">
          <div>
            <dt className="text-slate-400">Airdrop ID</dt>
            <dd className="mt-0.5 truncate font-mono text-[11px] text-slate-200">
              {details.id}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Token mint</dt>
            <dd className="mt-0.5 truncate font-mono text-[11px] text-slate-200">
              {details.tokenMint}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Recipients</dt>
            <dd className="mt-0.5 font-medium text-slate-100">
              {details.recipientsClaimed} / {details.recipientsTotal}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Amounts (claimed / total)</dt>
            <dd className="mt-0.5 font-medium text-slate-100">
              {details.amountClaimed} / {details.amountTotal}
              {!isPriceLoading && tokenPrices[details.tokenMint] && (
                <span className="ml-1 text-xs text-slate-400">
                  (
                  {formatUsdForTokenAmount(
                    details.amountClaimed,
                    details.tokenMint,
                    tokenPrices
                  )}{" "}
                  /{" "}
                  {formatUsdForTokenAmount(
                    details.amountTotal,
                    details.tokenMint,
                    tokenPrices
                  )}
                  )
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Start</dt>
            <dd className="mt-0.5 text-[11px] text-slate-300">
              {new Date(details.start * 1000).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">End</dt>
            <dd className="mt-0.5 text-[11px] text-slate-300">
              {new Date(details.end * 1000).toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Distribution progress</span>
            <span className="font-medium text-slate-200">
              {recipientProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${recipientProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950/90 to-surfaceAlt/90 p-4">
        <h3 className="text-sm font-semibold text-slate-100">
          Your allocation
        </h3>
        <p className="text-xs text-slate-400">
          Connected wallet:{" "}
          <span className="font-mono text-[11px] text-slate-300">
            {publicKey?.toBase58() ?? "Not connected"}
          </span>
        </p>

        <div className="mt-2 rounded-lg bg-slate-950/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            {hasClaimed ? "Status" : "Available to claim"}
          </p>
          {hasClaimed ? (
            <div className="mt-2 flex items-center gap-2">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xl font-semibold text-green-400">
                Claimed
              </span>
            </div>
          ) : (
            <>
              <p className="mt-1 text-xl font-semibold text-slate-50">
                {claimableAmount}
              </p>
              {!isPriceLoading && tokenPrices[details.tokenMint] && (
                <p className="mt-1 text-sm text-green-400">
                  ≈{" "}
                  {formatUsdForTokenAmount(
                    claimableAmount,
                    details.tokenMint,
                    tokenPrices
                  )}
                </p>
              )}
            </>
          )}
        </div>

        {!hasClaimed && (
          <button
            type="button"
            onClick={onClaim}
            disabled={
              !publicKey || isLoading || isClaiming || numericClaimable <= 0
            }
            className="mt-1 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-950/60 transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClaiming ? "Claiming…" : "Claim tokens"}
          </button>
        )}

        <p className="text-[11px] text-slate-500">
          Transactions are sent to Streamflow Distributor on devnet.
        </p>
      </div>
    </div>
  );
};
