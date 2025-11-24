export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950/80">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Airdrop</span>
        <span className="hidden sm:inline">
          Built with Streamflow &amp; Solana devnet
        </span>
      </div>
    </footer>
  )
}


