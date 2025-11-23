import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export const HomePage = () => {
  return (
    <div className="app-container">
      <main className="app-main">
        <WalletMultiButton />
      </main>
    </div>
  )
}
