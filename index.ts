import {
  AccountId,
  PrivateKey,
  Client,
  AccountBalanceQuery,
} from "@hashgraph/sdk";

import dotenv from "dotenv";
import { createAccount, getAccountIdByAlias } from "./services/hederaAccountService";
import { createFungibleToken, sendToken } from "./services/hederaTokenService";
dotenv.config();

/*
* Example for HIP-542

* ## Example: account creation with FT
* ### Steps
* 1. Create a treasury account
* 2. Create an fungible HTS token using the Hedera Token Service
* 3. Create an ECDSA public key alias
* 4. Transfer the fungible token to the public key alias using the transfer transaction
* 5. Return the new account ID in the child record
* 6. Show the new account ID owns the fungible token
*/

// create your client
const accountIdString = process.env.OPERATOR_ACCOUNT_ID;
const privateKeyString = process.env.OPERATOR_PRIVATE_KEY;
if (accountIdString === undefined || privateKeyString === undefined) { throw new Error('account id and private key in env file are empty') }

const operatorAccountId = AccountId.fromString(accountIdString);
const operatorPrivateKey = PrivateKey.fromString(privateKeyString);

const client = Client.forTestnet().setOperator(operatorAccountId, operatorPrivateKey);

const supplyKey = PrivateKey.generateECDSA();

const accountCreationWithFT = async () => {
  /**
   *
   * Step 1
   *
   * Create a treasury account
   */
  const [treasuryAccId, treasuryAccPvKey] = await createAccount(client, 100);
  console.log(`- Treasury's account: https://hashscan.io/#/testnet/account/${treasuryAccId}`);
  console.log(`- Treasury's private key: ${treasuryAccPvKey}`);

  /**
 *
 * Step 2
 *
 * Create a fungible HTS token using the Hedera Token Service
 */
  const tokenId = await createFungibleToken(client, treasuryAccId, supplyKey, treasuryAccPvKey, 10000, 'HIP-542 Token', 'H542');

  /**
*
* Step 3
*
* Create an ECDSA public key alias
*/
  console.log('- Creating a new account...\n');
  const privateKey = PrivateKey.generateECDSA();
  const publicKey = privateKey.publicKey;

  // Assuming that the target shard and realm are known.
  // For now they are virtually always 0 and 0.
  const aliasAccountId = publicKey.toAccountId(0, 0);

  console.log(`- New account ID: ${aliasAccountId.toString()}`);
  if (aliasAccountId.aliasKey === null) { throw new Error('alias key is empty') }
  console.log(`- Just the aliasKey: ${aliasAccountId.aliasKey.toString()}\n`);

  /**
   * Step 4
   *
   * Transfer the fungible token to the public key alias
   */
  console.log('- Transferring the fungible tokens...\n');
  await sendToken(client, tokenId, treasuryAccId, aliasAccountId, 10, treasuryAccPvKey);

  /**
   * Step 5
   *
   * Return the new account ID in the child record
   */

  const accountId = await getAccountIdByAlias(client, aliasAccountId);
  console.log(`The normal account ID of the given alias: ${accountId}`);

  /**
 * Step 6
 *
 * Show the new account ID owns the fungible token
 */


  const accountBalances = await new AccountBalanceQuery()
    .setAccountId(aliasAccountId)
    .execute(client);

  if (!accountBalances.tokens || !accountBalances.tokens._map) {
    throw new Error('account balance shows no tokens.')
  }

  const tokenBalanceAccountId = accountBalances.tokens._map
    .get(tokenId.toString());

  if (!tokenBalanceAccountId) {
    throw new Error(`account balance does not have tokens for token id: ${tokenId}.`);
  }

  tokenBalanceAccountId.toInt() === 10
    ? console.log(
      `Account is created successfully using HTS 'TransferTransaction'`
    )
    : console.log(
      "Creating account with HTS using public key alias failed"
    );

  client.close();
}
accountCreationWithFT();