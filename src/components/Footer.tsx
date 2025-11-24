export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-2 px-4 py-4 text-[11px] text-slate-500 sm:flex-row sm:items-center">
        <span className="text-xs">
          © {new Date().getFullYear()} Streamflow Airdrops
        </span>
        <span className="text-[11px] text-slate-500">
          Built for demo purposes on <span className="font-medium text-slate-300">Solana devnet</span>
        </span>
      </div>
    </footer>
  )
}
