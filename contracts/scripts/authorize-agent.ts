/**
 * Authorize (or revoke) an agent signing wallet on an already-deployed contract.
 *
 * Usage:
 *   ESCROW_ADDRESS=0x...  AGENT_SIGNER=0x...  npx hardhat run scripts/authorize-agent.ts --network arcTestnet
 *   ESCROW_ADDRESS=0x...  AGENT_SIGNER=0x...  REVOKE=true  npx hardhat run scripts/authorize-agent.ts --network arcTestnet
 *
 * Must be run from the deployer wallet (owner). Set DEPLOYER_PRIVATE_KEY in your .env or hardhat.config.
 */

import { ethers } from 'hardhat';

async function main() {
  const escrowAddress = process.env.ESCROW_ADDRESS;
  const agentSigner  = process.env.AGENT_SIGNER;
  const revoke       = process.env.REVOKE === 'true';

  if (!escrowAddress || !agentSigner) {
    console.error(
      'Missing env vars.\n' +
      'Usage: ESCROW_ADDRESS=0x... AGENT_SIGNER=0x... npx hardhat run scripts/authorize-agent.ts --network arcTestnet'
    );
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log('Owner wallet :', deployer.address);
  console.log('Escrow       :', escrowAddress);
  console.log('Agent signer :', agentSigner, revoke ? '(REVOKE)' : '(AUTHORIZE)');

  const escrow = await ethers.getContractAt('ArcHireEscrow', escrowAddress);

  const current = await escrow.authorizedAgents(agentSigner);
  const desired = !revoke;

  if (current === desired) {
    console.log(`\nNo change needed — already ${desired ? 'authorized' : 'revoked'}.`);
    return;
  }

  const tx = await escrow.setAgentAddress(agentSigner, desired);
  console.log('\nTx sent:', tx.hash);
  await tx.wait();
  console.log(desired
    ? `\n✅ ${agentSigner} is now authorized to call submitDelivery()`
    : `\n✅ ${agentSigner} has been revoked`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
