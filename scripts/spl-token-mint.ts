import { createFungible, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
} from '@metaplex-foundation/mpl-toolbox';
import { createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { base58 } from '@metaplex-foundation/umi/serializers';
import bs58 from 'bs58';
import { OWNER_PRIVATE_KEY } from '../constants/account.const';
import { AURA, TOKEN_METADATA_URI } from '../constants/common.const';

const main = async () => {
  const umi = createUmi(AURA).use(mplTokenMetadata());
  // Setup owner account
  const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(OWNER_PRIVATE_KEY));
  const owner = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(owner));

  // Account for the asset
  const mintSigner = generateSigner(umi);

  const createMintIx = createFungible(umi, {
    mint: mintSigner,
    name: 'THE TOKEN',
    uri: TOKEN_METADATA_URI,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 5,
  });

  const createTokenIx = createTokenIfMissing(umi, {
    mint: mintSigner.publicKey,
    owner: umi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  });

  const mintTokensIx = mintTokensTo(umi, {
    mint: mintSigner.publicKey,
    token: findAssociatedTokenPda(umi, {
      mint: mintSigner.publicKey,
      owner: umi.identity.publicKey,
    }),
    amount: BigInt(100000000000000),
  });

  console.log('Sending transaction');
  const tx = await createMintIx.add(createTokenIx).add(mintTokensIx).sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];

  console.log('\nTransaction Complete');
  console.log('View Transaction on Solana Explorer');
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log('View Token on Solana Explorer');
  console.log(`https://explorer.solana.com/address/${mintSigner.publicKey}?cluster=devnet`);
};

main();
