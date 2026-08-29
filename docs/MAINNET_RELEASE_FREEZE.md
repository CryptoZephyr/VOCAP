# Mainnet release freeze

This record freezes the static VOCAP production artifacts for review. It does not authorize funding, deployment, or private transactions. Mainnet-dependent addresses, constructor state, fee quotes, and privacy-service compatibility remain open in [MAINNET_READINESS.md](MAINNET_READINESS.md).

## Source and toolchain

- Source basis: the Git commit that contains this freeze record.
- Scarb: `2.20.1`
- Cairo: `2.20.0`
- Starknet.js: `10.5.0`
- Privacy SDK: `@starkware-libs/starknet-privacy-sdk@0.14.3-rc.2`, official tag `PRIVACY-0.14.3-RC.2`, commit `9bfeb8dd35565a2915a0617dff3f649bd5bb891a`
- Privacy SDK lockfile: upstream `sdk/package-lock.json`, SHA-256 `A93E86BFB7F10231C6584C40B29D5EE4DE96E349EC57AE7F822615BEFC97891B`

## Production contracts

| Contract | Sierra class hash | CASM compiled class hash | Sierra artifact SHA-256 | CASM artifact SHA-256 |
| --- | --- | --- | --- | --- |
| `VocapRouter` | `0x7f36c12a5d08a3b64cead89d94ac1969f8c6424dadd91731ad1ee3e20a6dde8` | `0x1041c8a960487be590d523bc28c9e16dc60132f9fe188b86e581478b5f05025` | `EB04D2F4D5C4E0B0FB40C7BAD9B32DEF94DCD057B4A645A82776E0D23C7CD29E` | `4FB7E23885FDEEE85AB5AE2C10A141A12C1C5D62D2BEEF982A08550594A9D09B` |
| `VocapApprovedTarget` | `0x7d637107437a81f099e7dd761fbd812059882fca8e62031a5979d6932f80a2f` | `0x4f5f6e21ea82b54e426e1b0d9f4e5f5eb1e4d3113fc634b414787ec06896b9f` | `26D4D5462920F1D96F3C318CAA0C302543A9EF1289FDF3F9B2F5CCA6A2F26045` | `DAF459E2D878464B0B083BE3B11D255BE483BFB568899057956E9E44F5741AE1` |

Additional generated artifact:

- `contracts/target/dev/vocap_contracts.starknet_artifacts.json`
- SHA-256: `51832A359D17259F2B62D99C3477FA0E35CEDFD5A00EA8E9D78F11BD79496726`

## Source locks

- `contracts/src/vocap_router.cairo`: `8DCBE622F6C995D19BCE4D5F1514314D9BEDB8764A478AEADFE79559BC0C3D6B`
- `contracts/src/vocap_approved_target.cairo`: `23F0B10406207ADC46599DD0EA96D80D4B778FF5DAC8700AA37C7BE39E7BB3EB`
- `contracts/Scarb.toml`: `694A0736D50C4B36E0866DF4BFA584CA15D268C114AF4D4924B556F8462911CA`
- `contracts/Scarb.lock`: `E8D15E2BDBDEEB4E2F789CC007AD2922C016120A3F5C40F837CB9213768E865C`

## Freeze limits

- The contract source and static artifacts are frozen for review. Contract tests and backend changes do not alter these production class hashes.
- The historical Router completed the real Sepolia STRK20 RETURN, succession, and backend indexing sequence. The frozen Router hash differs because it contains the post-review surplus-balance fix, so the exact frozen Router still requires a Sepolia deployment rehearsal.
- The Mainnet pool address, class hash, version, fee, and proof window were refreshed at block `14,001,956` and are recorded in [STARKNET_MAINNET_DEPENDENCIES.md](STARKNET_MAINNET_DEPENDENCIES.md).
- The exact Mainnet account, deployment, policy, final fee, proof, and service-image evidence is still required.
- No private key, viewing key, RPC credential, or wallet recovery secret belongs in this record or repository.
