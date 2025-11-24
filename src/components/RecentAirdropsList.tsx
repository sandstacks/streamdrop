type RecentAirdropItem = {
  id: string
  tokenMint: string
  recipientsClaimed: number
  recipientsTotal: number
  start: number
  end: number
  type: 'Vested' | 'Instant'
}

type Props = {
  items: RecentAirdropItem[]
  isLoading: boolean
  selectedId?: string
  onSelect: (id: string) => void
}

export const RecentAirdropsList = ({ items, isLoading, selectedId, onSelect }: Props) => {
  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 shadow-sm shadow-slate-950/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-300">
          Recent airdrops (devnet)
        </p>
        {isLoading && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
            Loading…
          </span>
        )}
      </div>
      <div className="mt-1 max-h-56 space-y-2 overflow-y-auto pr-1">
        {isLoading && items.length === 0 && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="h-11 w-full rounded-lg bg-slate-900/70 animate-pulse"
              />
            ))}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-[11px] text-slate-500">
            No airdrops found on devnet.
          </p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
              selectedId === item.id
                ? 'border-accent bg-slate-900 text-slate-50 shadow-md shadow-indigo-950/40'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-mono text-[11px]">
                {item.id}
              </p>
              <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                {item.type}
              </span>
            </div>
            <p className="mt-1 truncate font-mono text-[10px] text-slate-400">
              Mint: {item.tokenMint}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Recipients: {item.recipientsClaimed} / {item.recipientsTotal}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
