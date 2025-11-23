import { ICluster } from '@streamflow/stream'
import { StreamflowDistributorSolana } from '@streamflow/distributor'
import type { Connection } from '@solana/web3.js'
import { appConfig } from '../config'

const clusterFromEnv = (clusterName: string | undefined): ICluster => {
    switch (clusterName) {
      case 'mainnet-beta':
      case 'mainnet':
        return ICluster.Mainnet
      case 'devnet':
      default:
        return ICluster.Devnet
    }
  }

export type SimplifiedAirdrop = {
  id: string
  tokenMint: string
  recipientsClaimed: number
  recipientsTotal: number
  start: number
  end: number
  type: 'Vested' | 'Instant'
}

export const createDistributorClient = (connection: Connection | null) => {
  if (!connection) return null
  return new StreamflowDistributorSolana.SolanaDistributorClient({
    clusterUrl: connection.rpcEndpoint,
    cluster: clusterFromEnv(appConfig.streamflowCluster),
  })
}

export const mapDistributorsToAirdrops = (distributors: any[]): SimplifiedAirdrop[] => {
  return distributors
    .slice(0, 10)
    .map((item: any) => {
      const account = item.account ?? item

      const id =
        item.publicKey?.toBase58?.() ??
        (typeof account.id === 'string'
          ? account.id
          : account.id?.toBase58?.()) ??
        ''

      const start = account.startTs?.toNumber?.() ?? 0
      const end = account.endTs?.toNumber?.() ?? 0
      const isVested =
        end > start && account.unlockPeriod?.toNumber?.() > 0

      const typeValue: SimplifiedAirdrop['type'] = isVested ? 'Vested' : 'Instant'

      const tokenMint =
        (account.mint as any)?.toBase58?.() ??
        String(account.mint ?? '')

      return {
        id,
        tokenMint,
        recipientsClaimed: account.numNodesClaimed?.toNumber?.() ?? 0,
        recipientsTotal: account.maxNumNodes?.toNumber?.() ?? 0,
        start,
        end,
        type: typeValue,
      }
    })
    .filter((a) => a.id && a.tokenMint)
}


