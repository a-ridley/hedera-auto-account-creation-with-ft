import { TokenCreateTransaction, Hbar, TokenType, TransferTransaction, TransactionId, TokenAssociateTransaction, Client, AccountId, PrivateKey, TokenId } from '@hashgraph/sdk';

export const createFungibleToken = async (
  client: Client,
  treasureyAccId: string | AccountId,
  supplyKey: PrivateKey,
  treasuryAccPvKey: PrivateKey,
  initialSupply: number,
  tokenName: string,
  tokenSymbol: string,
): Promise<TokenId> => {
  /* 
    * Create a transaction with token type fungible
    * Returns Fungible Token Id
  */
  const createTokenTxn = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTokenType(TokenType.FungibleCommon)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(treasureyAccId)
    .setSupplyKey(supplyKey)
    .setMaxTransactionFee(new Hbar(30))
    .freezeWith(client); //freeze tx from from any further mods.

  const createTokenTxnSigned = await createTokenTxn.sign(treasuryAccPvKey);
  // submit txn to heder network
  const txnResponse = await createTokenTxnSigned.execute(client);
  // request receipt of txn
  const txnRx = await txnResponse.getReceipt(client);
  const txnStatus = txnRx.status.toString();
  const tokenId = txnRx.tokenId;
  if (tokenId === null) {
    throw new Error("Somehow tokenId is null");
  }

  console.log(
    `Token Type Creation was a ${txnStatus} and was created with token id: ${tokenId}`
  );

  return tokenId;
};


export const sendToken = async (client: Client, tokenId: TokenId, owner: AccountId, aliasAccountId: AccountId, sendBalance: number, treasuryAccPvKey: PrivateKey) => {
  const tokenTransferTx = new TransferTransaction()
    .addTokenTransfer(tokenId, owner, -sendBalance)
    .addTokenTransfer(tokenId, aliasAccountId, sendBalance)
    .freezeWith(client);

     // Sign the transaction with the operator key
     let tokenTransferTxSign = await tokenTransferTx.sign(treasuryAccPvKey);

     // Submit the transaction to the Hedera network
     let tokenTransferSubmit = await tokenTransferTxSign.execute(client);
 
     // Get transaction receipt information
    await tokenTransferSubmit.getReceipt(client);
}
