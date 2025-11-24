// Utility helpers for fetching token prices from Jupiter Price API
// and converting token amounts into USD values for display.
//
// NOTE: Jupiter's public docs now recommend the v3 price API
// (v2 has been deprecated). This wrapper uses the v3 endpoint,
// which is the current replacement for v2:
//   https://lite-api.jup.ag/price/v3?ids=<mint1>,<mint2>,...

const JUPITER_PRICE_API_BASE = 'https://lite-api.jup.ag/price/v3'

// --- Types -----------------------------------------------------------------

export type MintAddress = string

export type TokenPriceMap = Record<MintAddress, number>

type JupiterPriceApiToken = {
  id: string
  type: string
  price: number
  // The API returns more fields, but we only care about `price` here.
  [key: string]: unknown
}

type JupiterPriceApiResponse = {
  data: Record<MintAddress, JupiterPriceApiToken>
  timeTaken: number
}

type CacheEntry = {
  prices: TokenPriceMap
  fetchedAt: number
}

// In–memory cache and in–flight request deduplication
const priceCache: Record<string, CacheEntry> = {}
const inFlightRequests: Record<string, Promise<TokenPriceMap>> = {}

export type FetchPricesOptions = {
  /**
   * Cache TTL in milliseconds. Default: 30_000 (30 seconds).
   */
  cacheTtlMs?: number
  /**
   * If true, bypass the cache and always hit the API.
   */
  forceRefresh?: boolean
  /**
   * Optional AbortSignal to cancel the underlying fetch.
   */
  signal?: AbortSignal
}

// --- Internal helpers ------------------------------------------------------

const normalizeMintList = (mints: MintAddress[]): MintAddress[] =>
  Array.from(new Set(mints.filter(Boolean))).sort()

const cacheKeyForMints = (mints: MintAddress[]): string =>
  normalizeMintList(mints).join(',')

const isCacheFresh = (entry: CacheEntry, ttlMs: number): boolean =>
  Date.now() - entry.fetchedAt <= ttlMs

// --- Public API ------------------------------------------------------------

/**
 * Fetch USD prices for a list of token mints using Jupiter's Price API.
 *
 * - Automatically deduplicates concurrent requests for the same mint set.
 * - Caches responses in-memory for a short TTL.
 * - Always returns a mapping `{ [mint]: priceInUsd }`.
 */
export async function fetchJupiterTokenPrices(
  mints: MintAddress[],
  options: FetchPricesOptions = {},
): Promise<TokenPriceMap> {
  const normalizedMints = normalizeMintList(mints)

  if (normalizedMints.length === 0) {
    return {}
  }

  const { cacheTtlMs = 30_000, forceRefresh = false, signal } = options
  const key = cacheKeyForMints(normalizedMints)

  // 1. Return fresh cache if available
  if (!forceRefresh) {
    const cached = priceCache[key]
    if (cached && isCacheFresh(cached, cacheTtlMs)) {
      return cached.prices
    }
  }

  // 2. If there is already an in–flight request for this key, reuse it
  if (!forceRefresh && Object.prototype.hasOwnProperty.call(inFlightRequests, key)) {
    return inFlightRequests[key]
  }

  // 3. Build URL for Jupiter Price API
  const idsParam = encodeURIComponent(normalizedMints.join(','))
  const url = `${JUPITER_PRICE_API_BASE}?ids=${idsParam}`

  const requestPromise: Promise<TokenPriceMap> = (async () => {
    try {
      const response = await fetch(url, { signal })
      if (!response.ok) {
        console.error('Failed to fetch Jupiter prices:', response.status, response.statusText)
        return {}
      }

      const json = (await response.json()) as JupiterPriceApiResponse
      const prices: TokenPriceMap = {}

      for (const mint of normalizedMints) {
        const entry = json.data[mint]
        if (entry && typeof entry.price === 'number') {
          prices[mint] = entry.price
        }
      }

      priceCache[key] = {
        prices,
        fetchedAt: Date.now(),
      }

      return prices
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was intentionally cancelled by caller
        console.warn('Jupiter price request aborted')
      } else {
        console.error('Error fetching Jupiter prices:', error)
      }
      return {}
    } finally {
      delete inFlightRequests[key]
    }
  })()

  inFlightRequests[key] = requestPromise
  return requestPromise
}

/**
 * Safely parse a human–formatted token amount string (e.g. "1,234.56")
 * into a number. Non–numeric or empty input returns 0.
 */
export function parseAmountToNumber(amount: string | number | null | undefined): number {
  if (typeof amount === 'number') return amount
  if (!amount) return 0

  const cleaned = String(amount).replace(/,/g, '').trim()
  const asNumber = Number(cleaned)
  return Number.isFinite(asNumber) ? asNumber : 0
}

/**
 * Compute the USD value for a given token amount and mint, using
 * a previously-fetched `TokenPriceMap`.
 */
export function getUsdValueForAmount(
  amount: string | number,
  mint: MintAddress,
  prices: TokenPriceMap,
): number | null {
  const numericAmount = parseAmountToNumber(amount)
  const price = prices[mint]

  if (!price || numericAmount <= 0) return null
  return numericAmount * price
}

export type FormatUsdOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Format a USD value for display, e.g. `$1,234.56`.
 * Returns `'–'` if the value is `null` or non–positive.
 */
export function formatUsd(
  usdValue: number | null | undefined,
  options: FormatUsdOptions = {},
): string {
  if (!usdValue || !Number.isFinite(usdValue) || usdValue <= 0) {
    return '–'
  }

  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options

  return usdValue.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

/**
 * Convenience helper: given a formatted token amount string and a mint,
 * compute and format the corresponding USD value in one step.
 *
 * Example usage in a component:
 *
 * ```ts
 * const prices = await fetchJupiterTokenPrices([details.tokenMint])
 * const usdLabel = formatUsdForTokenAmount(
 *   claimableAmount,          // e.g. "123.45"
 *   details.tokenMint,        // SPL mint address
 *   prices,
 * )
 * // usdLabel -> e.g. "$1,234.56"
 * ```
 */
export function formatUsdForTokenAmount(
  amount: string | number,
  mint: MintAddress,
  prices: TokenPriceMap,
  options?: FormatUsdOptions,
): string {
  const usd = getUsdValueForAmount(amount, mint, prices)
  return formatUsd(usd, options)
}
