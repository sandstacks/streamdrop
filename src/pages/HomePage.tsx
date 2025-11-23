import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { AirdropClaimer } from '../components/AirdropClaimer'

export const HomePage = () => {
  return (
    <div className="app-container">
      <main className="app-main">
        <div className="home-content">
          <WalletMultiButton />
          <AirdropClaimer />
        </div>
      </main>
    </div>
  )
}
