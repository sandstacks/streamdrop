import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Buffer } from 'buffer';

// ==========================================================================
// 1. MATCH YOUR CSV EXACTLY
// ==========================================================================

const recipients = [
  { address: "3evmDeAorZTVactvkYdXXU4pXVjxWDrESVivPffCrkjY", amount: 30 }, 
  { address: "3evnDeAorZTVactvkYdXXU4pXVjxWDrESVivPffCrkjY", amount: 30 },
  { address: "3evnDeAorZTVactvkYdXXU4pXVjxWDrESVivPffCrkjY", amount: 30 }
];

// YOUR TARGET WALLET
const targetWallet = "3evmDeAorZTVactvkYdXXU4pXVjxWDrESVivPffCrkjY";
const TOKEN_DECIMALS = 9; 

// ==========================================================================

const generateProof = () => {
  console.log("🌳 Generating Merkle Tree...");

  // 0. Sort recipients by address (Standard practice for Merkle Trees)
  // If this fails, try removing the sort, but usually, it's required.
  recipients.sort((a, b) => a.address.localeCompare(b.address));

  // 1. Prepare Leaves
  const leaves = recipients.map((recipient) => {
    const addressBuf = new PublicKey(recipient.address).toBuffer();

    // For Instant Airdrops: Amount Unlocked = Full Amount, Locked = 0
    // Streamflow uses raw units. If you put "30" in CSV, it means 30 raw units (0.000000030 tokens).
    // IF you meant 30 full tokens, you need to multiply by 10^9.
    // CHECK: Did you put "30" or "30000000000" in the CSV? 
    // The UI shows "30 P", which usually means the contract sees 30 * 10^9 raw units.
    // Let's assume the CSV contained "30" and Streamflow's UI parsed it as 30 tokens.
    // If so, we need to multiply here.
    
    const rawAmount = new BN(recipient.amount).mul(new BN(10).pow(new BN(TOKEN_DECIMALS)));
    // If your CSV literally had "30000000000", remove the line above and use:
    // const rawAmount = new BN(recipient.amount);

    const unlockedVal = rawAmount;
    const lockedVal = new BN(0);

    const unlockedBuf = unlockedVal.toArrayLike(Buffer, 'le', 8);
    const lockedBuf = lockedVal.toArrayLike(Buffer, 'le', 8);

    // Structure: Keccak256(Address + AmountUnlocked + AmountLocked)
    const bufferToHash = Buffer.concat([addressBuf, unlockedBuf, lockedBuf]);
    
    return {
      leaf: keccak256(bufferToHash),
      address: recipient.address,
      amountUnlocked: unlockedVal,
      amountLocked: lockedVal
    };
  });

  // 2. Build Tree
  const tree = new MerkleTree(leaves.map(x => x.leaf), keccak256, { sort: true });
  const root = tree.getHexRoot();
  
  console.log("✅ Merkle Root:", root);

  // 3. Find Target
  const target = leaves.find(x => x.address === targetWallet);
  
  if (!target) {
    console.error(`❌ Wallet ${targetWallet} not found in sorted list!`);
    return;
  }

  // 4. Generate Proof
  const proof = tree.getHexProof(target.leaf);
  
  // Convert to byte arrays
  const formattedProof = proof.map(hexStr => 
    Array.from(Buffer.from(hexStr.replace('0x', ''), 'hex'))
  );

  console.log("\n🎉 SUCCESS! COPY THIS FOR HARDCODED_DATA:");
  console.log("=================================================");
  console.log(`recipient: "${targetWallet}",`);
  console.log(`amountUnlocked: "${target.amountUnlocked.toString()}",`);
  console.log(`amountLocked: "${target.amountLocked.toString()}",`);
  console.log(`proof: ${JSON.stringify(formattedProof)}`);
  console.log("=================================================");
};

generateProof();
