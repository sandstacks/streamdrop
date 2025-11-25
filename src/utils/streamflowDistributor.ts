import { ICluster } from '@streamflow/stream'
import { StreamflowDistributorSolana } from '@streamflow/distributor'
import type { Connection, PublicKey } from '@solana/web3.js'
import { appConfig } from './config'

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

type NumberLike = {
  toNumber?: () => number
}

type PublicKeyLike = {
  toBase58?: () => string
}

export type DistributorAccountLike = {
  id?: string | PublicKeyLike
  startTs?: NumberLike
  endTs?: NumberLike
  unlockPeriod?: NumberLike
  mint?: PublicKeyLike | string
  numNodesClaimed?: NumberLike
  maxNumNodes?: NumberLike
  [key: string]: unknown
}

export type DistributorLike = {
  publicKey?: PublicKeyLike
  account?: DistributorAccountLike
  [key: string]: unknown
}

export type DistributorClient = {
  getDistributorProgramId: () => PublicKey
  getClaim: (pubkey: PublicKey) => Promise<unknown>
  getDistributors: (args: { ids?: string[] }) => Promise<DistributorLike[] | unknown[]>
  searchDistributors: (args: Record<string, unknown>) => Promise<DistributorLike[] | unknown[]>
  claim: (params: unknown, opts: unknown) => Promise<{ txId: string }>
  closeClaim: (params: unknown, opts: unknown) => Promise<{ txId: string }>
}

export const createDistributorClient = (connection: Connection | null): DistributorClient | null => {
  if (!connection) return null
  return new StreamflowDistributorSolana.SolanaDistributorClient({
    clusterUrl: connection.rpcEndpoint,
    cluster: clusterFromEnv(appConfig.streamflowCluster),
  }) as unknown as DistributorClient
}

export const mapDistributorsToAirdrops = (distributors: DistributorLike[], limit?: number): SimplifiedAirdrop[] => {
  const items = limit ? distributors.slice(0, limit) : distributors
  return items
    .map((item) => {
      const account: DistributorAccountLike = item.account ?? (item as DistributorAccountLike)

      const id =
        item.publicKey?.toBase58?.() ??
        (typeof account.id === 'string'
          ? account.id
          : account.id?.toBase58?.()) ??
        ''

      const start = account.startTs?.toNumber?.() ?? 0
      const end = account.endTs?.toNumber?.() ?? 0
      const isVested = end > start && (account.unlockPeriod?.toNumber?.() ?? 0) > 0

      const typeValue: SimplifiedAirdrop['type'] = isVested ? 'Vested' : 'Instant'

      const mintField = account.mint
      const tokenMint =
        typeof mintField === 'object' && mintField?.toBase58
          ? mintField.toBase58()
          : String(mintField ?? '')

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
