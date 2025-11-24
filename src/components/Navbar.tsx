import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const Navbar = () => {
  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-indigo-500/50 bg-indigo-500/15 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            SF
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-50 sm:text-base">
              Streamflow Airdrops
            </span>
          </div>
        </div>

        <div className="flex items-center relative z-40">
          <WalletMultiButton
            className="!rounded-xl !border !border-indigo-400/60 !bg-indigo-500/90 !px-4 !py-2 !text-xs !font-semibold !uppercase !tracking-[0.14em] !text-white shadow-md shadow-indigo-950/60 transition hover:!bg-indigo-400 focus-visible:!ring-2 focus-visible:!ring-indigo-300 focus-visible:!ring-offset-2 focus-visible:!ring-offset-slate-950"
          />
        </div>
      </div>
    </nav>
  );
};
