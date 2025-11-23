import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const Navbar = () => {
  return (
    <nav className="w-full bg-slate-950/80 border-b border-slate-800 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">

        <h1 className="text-xl font-bold text-white tracking-wide select-none">
          Airdrop
        </h1>

        <div className="flex items-center">
          <WalletMultiButton className="!bg-indigo-600 !text-white 
            hover:!bg-indigo-500 transition rounded-xl px-4 py-2 shadow-md" />
        </div>
      </div>
    </nav>
  );
};

