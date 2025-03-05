import { create, mplCore } from '@metaplex-foundation/mpl-core';
import { createSignerFromKeypair, generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import bs58 from 'bs58';
import { OWNER_PRIVATE_KEY } from '../constants/account.const';
import { AURA, METADATA_URI } from '../constants/common.const';
import { base58 } from '@metaplex-foundation/umi/serializers';

const main = async () => {
  const umi = createUmi(AURA).use(mplCore());

  const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(OWNER_PRIVATE_KEY));
  const owner = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(owner));

  const assetSigner = generateSigner(umi);

  console.log('Sending transaction');
  const mint = await create(umi, {
    asset: assetSigner,
    name: 'MY SOLANA NFT',
    uri: METADATA_URI,
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(mint.signature)[0];

  console.log(`\nSuccess mint to ${owner.publicKey}: `);
  console.log('View Transaction on Solana Explorer');
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log('View NFT-Token on Solana Explorer');
  console.log(`https://explorer.solana.com/address/${assetSigner.publicKey}?cluster=devnet`);
};

main();
