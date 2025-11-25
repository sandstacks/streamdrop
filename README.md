# Streamflow Airdrop

A React + TypeScript web application for viewing and claiming Streamflow Airdrops on Solana. Built using the [Streamflow JS SDK](https://github.com/streamflow-finance/js-sdk/) and integrated with Phantom wallet for seamless user experience.

## Tech Stack

- **Frontend:** React + TypeScript
- **Build Tool:** Vite
- **Blockchain:** Solana (devnet)
- **SDK:** @streamflow/distributor 
- **Wallet:** Solana wallet adapter + Phantom
- **Styling:** Tailwind CSS
- **Notifications:** react-hot-toast

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Phantom Wallet browser extension
- SOL on devnet (for transaction fees when claiming)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd streamdrop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_STREAMFLOW_API_BASE=https://staging-api-public.streamflow.finance
VITE_STREAMFLOW_CHAIN=solana
VITE_STREAMFLOW_CLUSTER=devnet
```

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

Build the optimized production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage Guide

### 1. Connect Wallet
- Click "Select Wallet" button in the top-right corner
- Choose Phantom wallet
- Approve the connection request

### 2. View Airdrop Details

**Option A: Manual Entry**
- Enter an Airdrop ID (distributor address) in the input field
- Click "Fetch details" button

**Option B: Browse List**
- Scroll down to "Recent Airdrops" section
- Click on any airdrop from the list

### 3. Claim Tokens
- Once airdrop details are loaded, check "Your allocation" section
- If you have claimable tokens, click "Claim tokens" button
- Approve the transaction in Phantom wallet
- If the airdrop allows it, the claim will be automatically closed to reclaim rent

### 4. View USD Values
- USD prices are automatically fetched from Jupiter Price API
- They appear next to token amounts (when available)
- Prices update every 30 seconds via caching

## Project Structure

```
src/
├── components/
│   ├── AirdropClaimer.tsx          # Main component with claim logic
│   ├── AirdropDetailsSection.tsx   # Displays airdrop parameters
│   ├── RecentAirdropsList.tsx      # Lists available airdrops
│   ├── HomePage.tsx                # Main page layout
│   ├── Navbar.tsx                  # Wallet connection UI
│   └── Footer.tsx                  # Footer component
├── hooks/
│   ├── useAirdropDetails.ts        # Fetch & manage airdrop data
│   ├── useAirdropList.ts           # Fetch list of airdrops
│   └── index.ts                    # Hook exports
├── utils/
│   ├── streamflowDistributor.ts    # SDK client & helpers
│   ├── jupiterPrice.ts             # Price fetching utilities
│   ├── format.ts                   # Number formatting
│   ├── config.ts                   # App configuration
│   └── index.ts                    # Utility exports
├── App.tsx                         # Root component
├── main.tsx                        # Entry point + wallet setup
└── index.css                       # Global styles
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `VITE_STREAMFLOW_API_BASE` | Streamflow API base URL | `https://staging-api-public.streamflow.finance` |
| `VITE_STREAMFLOW_CHAIN` | Blockchain network | `solana` |
| `VITE_STREAMFLOW_CLUSTER` | Solana cluster | `devnet` |

## Testing with Devnet

1. Get devnet SOL from [Solana Faucet](https://faucet.solana.com/)
2. Create test airdrops using [Streamflow App](https://app.streamflow.finance/)
3. Use devnet mode in Phantom wallet settings

## Resources

- [Streamflow JS SDK](https://github.com/streamflow-finance/js-sdk/)
- [Streamflow Documentation](https://docs.streamflow.finance/)
- [Streamflow API Docs](https://api-public.streamflow.finance/docs)
- [Solana Documentation](https://docs.solana.com/)
- [Phantom Wallet](https://phantom.app/)
- [Jupiter Price API](https://station.jup.ag/docs/)
