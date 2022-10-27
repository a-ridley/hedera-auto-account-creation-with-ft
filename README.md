# Example for HIP-542
## Auto-Account creation when sending FT to an alias
### Steps
1. Create a treasury account
2. Create an fungible HTS token using the Hedera Token Service
3. Create an ECDSA public key alias
4. Transfer the fungible token to the public key alias using the transfer transaction
5. Return the new account ID in the child record
6. Show the new account ID owns the fungible token


## How to run
`npm i`

`npm run start`
