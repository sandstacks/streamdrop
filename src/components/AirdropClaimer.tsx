import { useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { StreamflowSolana } from '@streamflow/stream'

export const AirdropClaimer = () => {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const [airdropId, setAirdropId] = useState('')
  const [airdropDetails, setAirdropDetails] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize the Streamflow SDK Solana client using the active devnet
  // connection endpoint and require a connected wallet public key.
  const client = useMemo(() => {
    if (!connection || !publicKey) return null

    return new StreamflowSolana.SolanaStreamClient(connection.rpcEndpoint)
  }, [connection, publicKey])

  const handleFetchDetails = () => {
    if (!client) {
      setError('Please connect your wallet to initialize the Streamflow client.')
      return
    }

    if (!airdropId) {
      setError('Please enter an Airdrop ID.')
      return
    }

    try {
      const airdropPublicKey = new PublicKey(airdropId)

      // Placeholder: in later steps, replace this with an actual SDK call
      // such as `client.getAirdrop(airdropPublicKey)` to fetch real data.
      setAirdropDetails({
        airdropId: airdropPublicKey.toBase58(),
        initializedForWallet: publicKey?.toBase58(),
      })
      setError(null)
    } catch {
      setError('Invalid Airdrop ID. Please enter a valid Solana address.')
      setAirdropDetails(null)
    }
  }

  return (
    <section className="airdrop-claimer">
      <h2>Airdrop Claimer</h2>
      <p className="airdrop-claimer__hint">
        Enter an airdrop ID (Solana address) and fetch its details on devnet.
      </p>

      <div className="airdrop-claimer__form">
        <input
          type="text"
          placeholder="Airdrop ID (Solana address)"
          value={airdropId}
          onChange={(e) => setAirdropId(e.target.value)}
        />
        <button type="button" onClick={handleFetchDetails}>
          Fetch Airdrop Details
        </button>
      </div>

      {error && <p className="airdrop-claimer__error">{error}</p>}

      {airdropDetails && (
        <div className="airdrop-claimer__details">
          <h3>Airdrop Details</h3>
          <pre>{JSON.stringify(airdropDetails, null, 2)}</pre>
        </div>
      )}
    </section>
  )
}


