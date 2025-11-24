import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const Navbar = () => {
  return (
    <nav className="fixed inset-x-0 top-0 bg-slate-950/80 border-b border-slate-800 backdrop-blur-lg z-30">
      <div className="w-full px-6 py-3 flex items-center justify-between">

        <h1 className="text-xl font-bold text-white tracking-wide select-none">
          Airdrop
        </h1>

        <div className="flex items-center relative z-40">
          <WalletMultiButton className="!bg-indigo-600 !text-white 
            hover:!bg-indigo-500 transition rounded-xl px-4 py-2 shadow-md" />
        </div>
      </div>
    </nav>
  );
};

