import { createTree, mintToCollectionV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import bs58 from 'bs58';
import { OWNER_PRIVATE_KEY } from '../constants/account.const';
import { AURA, COLLECTION_METADATA_URL, METADATA_URI } from '../constants/common.const';

const main = async () => {
  const umi = createUmi('https://api.devnet.solana.com').use(mplBubblegum()).use(mplTokenMetadata());

  const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(OWNER_PRIVATE_KEY));
  const owner = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(owner));

  const merkleTree = generateSigner(umi);

  const createTreeTx = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
    canopyDepth: 8,
  });

  console.log('Create Tree Transaction');

  await createTreeTx.sendAndConfirm(umi);

  console.log('Tree created: ', merkleTree.publicKey.toString());

  const collectionSigner = generateSigner(umi);

  await createNft(umi, {
    mint: collectionSigner,
    name: 'SOLANA cNFT COLLECTION',
    uri: COLLECTION_METADATA_URL,
    isCollection: true,
    sellerFeeBasisPoints: percentAmount(0),
  }).sendAndConfirm(umi);

  console.log('Collection created: ', collectionSigner.publicKey.toString());

  const addresses = [
    '11111111111111111111111111111111',
    'CmQzXQ76L9jDQ1Uprk1NRghDfx8ZoizARqyZrsgzsLhr',
    'DyN53rq2AZkVzyVTTijbpHbEh6LtU4U3ECtgDKyjh9Ys',
    '4eG3uY8EFTWjpapmAGHQv9f6vVxkH9RbtNE7oD4vqaJM',
  ];

  let index = 0;

  for await (const address of addresses) {
    const newOwner = publicKey(address);
    console.log('Minting Compressed NFT for: ', newOwner.toString().slice(0, 7));

    await mintToCollectionV1(umi, {
      leafOwner: newOwner,
      merkleTree: merkleTree.publicKey,
      collectionMint: collectionSigner.publicKey,
      metadata: {
        name: `SOLANA cNFT COLLECTION #${index}`,
        uri: METADATA_URI,
        sellerFeeBasisPoints: 500, // 5%
        collection: { key: collectionSigner.publicKey, verified: false },
        creators: [{ address: umi.identity.publicKey, verified: true, share: 100 }],
      },
    }).sendAndConfirm(umi);

    index++;
  }
};

main();
