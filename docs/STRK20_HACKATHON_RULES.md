# STRK20 hackathon release gates

This project uses the public [STRK20 hackathon repository](https://github.com/starkience/strk20-hackathon) as a release reference. These rules separate the public repository and registration steps from the later mainnet evidence gates.

## Repository and registration

- The VOCAP repository must be public and open source, with a license, before a scoring submission.
- The root `strk20.json` must contain only real values for contracts, transaction hashes, demo URLs, and videos. Add each field only when its value exists, and never use placeholders.
- A registration pull request adds only the VOCAP object to the hackathon registry. Existing registry rows and unrelated files remain unchanged.
- No secret, private key, viewing key, signer material, or fabricated deployment evidence belongs in the repository.

## Mainnet evidence

- The submission requires a real Starknet mainnet application using the live STRK20 pool.
- At least three successful mainnet transactions must touch the pool and be recorded in `strk20.json`.
- A public demo URL and a short demo video are required for the scoring submission.
- A public repository and registry application can be prepared before mainnet evidence exists. The scoring submission remains incomplete until every required contract, transaction, demo, and video value is real and verified.

## Privacy boundaries

- Deposits are public at the privacy boundary.
- Note-to-note transfers can remain private through the STRK20 flow.
- Swap or execution amounts and timing can remain publicly observable at the pool boundary.
- VOCAP does not claim hidden target execution, hidden calldata, hidden timing, erased provenance, identity proof, or arbitrary predicate proofs.

## VOCAP order of operations

1. Complete local Cairo and backend verification.
2. Run the real reusable `RETURN` and succession flow on Sepolia.
3. Freeze artifacts and run mainnet fee dry-runs.
4. Fund only the exact required amount plus the approved buffer.
5. Deploy to mainnet and collect the minimum meaningful proof transactions.
6. Publish the repository and registry application after independent release checks pass. Add scoring evidence only after the corresponding Sepolia and mainnet gates are verified.
