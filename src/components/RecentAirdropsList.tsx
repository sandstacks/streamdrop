type RecentAirdropItem = {
  id: string;
  tokenMint: string;
  recipientsClaimed: number;
  recipientsTotal: number;
  start: number;
  end: number;
  type: "Vested" | "Instant";
};

type Props = {
  items: RecentAirdropItem[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
};

export const RecentAirdropsList = ({
  items,
  totalCount,
  hasMore,
  isLoading,
  selectedId,
  onSelect,
  onLoadMore,
}: Props) => {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm shadow-slate-950/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">
          Available Airdrops
          {totalCount > 0 && (
            <span className="text-slate-400">
              {" "}
              ({items.length}/{totalCount})
            </span>
          )}
        </p>
        {isLoading && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
            Loading…
          </span>
        )}
      </div>

      <div className="mt-2 max-h-96 space-y-2.5 overflow-y-auto pr-1">
        {isLoading && items.length === 0 && (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 w-full rounded-lg bg-slate-900/70 animate-pulse"
              />
            ))}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-xs text-slate-500 py-4 text-center">
            No airdrops found on devnet.
          </p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-lg border px-4 py-3 text-left transition ${
              selectedId === item.id
                ? "border-accent bg-slate-900 text-slate-50 shadow-md shadow-indigo-950/40"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="truncate font-mono text-xs text-slate-200">
                {item.id}
              </p>
              <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 border border-slate-700">
                {item.type}
              </span>
            </div>
            <p className="mt-1.5 truncate font-mono text-[11px] text-slate-400">
              Mint: {item.tokenMint}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Recipients:{" "}
              <span className="font-medium text-slate-300">
                {item.recipientsClaimed} / {item.recipientsTotal}
              </span>
            </p>
          </button>
        ))}
      </div>
      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-slate-100"
        >
          Load More Airdrops
        </button>
      )}
    </div>
  );
};
