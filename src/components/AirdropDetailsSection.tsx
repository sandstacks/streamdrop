import type { PublicKey } from '@solana/web3.js'

type AirdropDetails = {
  id: string
  tokenMint: string
  type: string
  recipientsClaimed: number
  recipientsTotal: number
  amountClaimed: string
  amountTotal: string
  start: number
  end: number
}

type Props = {
  details: AirdropDetails
  publicKey: PublicKey | null
  claimableAmount: string
  numericClaimable: number
  isLoading: boolean
  isClaiming: boolean
  onClaim: () => void
}

export const AirdropDetailsSection = ({
  details,
  publicKey,
  claimableAmount,
  numericClaimable,
  isLoading,
  isClaiming,
  onClaim,
}: Props) => {
  return (
    <div className="mt-2 grid gap-4 sm:grid-cols-[2fr,1.3fr]">
      <div className="space-y-3 rounded-xl border border-slate-800 bg-surfaceAlt/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Airdrop overview</h3>
          <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
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
      </div>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-surfaceAlt/70 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Your allocation</h3>
        <p className="text-xs text-slate-400">
          Connected wallet:{' '}
          <span className="font-mono text-[11px] text-slate-300">
            {publicKey?.toBase58() ?? 'Not connected'}
          </span>
        </p>

        <div className="mt-2 rounded-lg bg-slate-950/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Claimable amount
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-50">
            {claimableAmount}{' '}
            <span className="text-xs font-normal text-slate-400">
              (including locked + unlocked)
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClaim}
          disabled={
            !publicKey ||
            isLoading ||
            isClaiming ||
            numericClaimable <= 0
          }
          className="mt-1 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-950/60 transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? 'Claiming…' : 'Claim tokens'}
        </button>

        <p className="text-[11px] text-slate-500">
          The transaction will be sent from your connected wallet to the Streamflow Merkle
          Distributor program on devnet.
        </p>
      </div>
    </div>
  )
}
