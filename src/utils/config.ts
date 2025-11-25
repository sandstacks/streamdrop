const SOLANA_RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'

const STREAMFLOW_API_BASE =
  import.meta.env.VITE_STREAMFLOW_API_BASE ?? 'https://api-public.streamflow.finance'

const STREAMFLOW_CHAIN =
  import.meta.env.VITE_STREAMFLOW_CHAIN ?? 'solana'

const STREAMFLOW_CLUSTER =
  import.meta.env.VITE_STREAMFLOW_CLUSTER ?? 'devnet'

export const appConfig = {
  solanaRpcUrl: SOLANA_RPC_URL,
  streamflowApiBase: STREAMFLOW_API_BASE,
  streamflowChain: STREAMFLOW_CHAIN,
  streamflowCluster: STREAMFLOW_CLUSTER,
} as const
