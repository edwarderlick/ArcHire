import { ethers } from 'hardhat';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying ArcHireEscrow to Arc Testnet...');
  console.log('Deployer:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer native balance:', ethers.formatUnits(balance, 18), 'USDC');

  if (balance === 0n) {
    console.error('\n⚠  Deployer has no funds. Get test USDC gas at https://faucet.circle.com (select Arc Testnet)');
    process.exit(1);
  }

  const Factory = await ethers.getContractFactory('ArcHireEscrow');
  const escrow = await Factory.deploy(USDC_ADDRESS);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log('\n✅ ArcHireEscrow deployed to:', address);
  console.log('   Block explorer: https://testnet.arcscan.app/address/' + address);
  console.log('\nAdd to .env.local:');
  console.log('  VITE_ESCROW_CONTRACT_ADDRESS=' + address);
  console.log('\nUpdate Supabase secrets:');
  console.log('  supabase secrets set ESCROW_CONTRACT_ADDRESS=' + address);
  console.log('\nAuthorize your agent signing wallet (replace 0x... with AGENT_PRIVATE_KEY address):');
  console.log('  ESCROW_ADDRESS=' + address + ' AGENT_SIGNER=0x... npx hardhat run scripts/authorize-agent.ts --network arcTestnet');
  console.log('\nNext steps:');
  console.log('  1. Copy VITE_ESCROW_CONTRACT_ADDRESS above into .env.local');
  console.log('  2. Run the authorize-agent.ts script above for your AGENT_PRIVATE_KEY wallet');
  console.log('  3. In Supabase: UPDATE agents SET owner_wallet = \'<payout-wallet>\' WHERE owner_wallet IS NULL;');
  console.log('  4. Run: npm run dev');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
