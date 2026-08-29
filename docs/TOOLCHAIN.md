# VOCAP toolchain

The repository pins the tool versions observed in the verified WSL 2 Ubuntu environment.

| Tool | Version | Verification |
| --- | --- | --- |
| Scarb | 2.20.1 | `scarb --version` |
| Cairo compiler | 2.20.0 | included in Scarb output |
| Starknet Foundry | 0.63.0 | `snforge --version` |
| Starknet Cast | 0.63.0 | `sncast --version` |
| Starknet Devnet | 0.8.0-rc.3 | `starknet-devnet --version`, the RC2-compatible devnet launcher |
| Cairo coverage | 0.6.1 | asdf tool version |
| Cairo profiler | 0.17.0 | asdf tool version |
| Node.js | 24.15.0 | `node --version` |
| npm | 11.12.1 | `npm --version` |
| pnpm | 10.28.2 | `corepack pnpm --version` |
| Rust | 1.98.0 | `rustc --version` |
| GCC | 15.2.0 | `cc --version` |
| PostgreSQL | 18.6 | WSL package and local projection test |

The commands were verified inside Ubuntu running under WSL 2 on 2026-08-29.

Rust and Ubuntu build-essential are installed because Starknet tooling builds native dependencies. In non-interactive WSL shells, source Rust with:

```bash
source "$HOME/.cargo/env"
```

## Shell requirement

Non-interactive WSL commands must expose asdf before using the pinned shims:

```bash
export PATH="$HOME/.local/bin:$HOME/.asdf/shims:$PATH"
```

Use `corepack pnpm` inside WSL. Plain `pnpm` can resolve to the Windows installation inherited through `/mnt/c`, which is a different version.

## Required agent tooling

The five required skills are installed from `keep-starknet-strange/starknet-agentic`:

- `cairo-contract-authoring`
- `cairo-testing`
- `cairo-auditor`
- `starknet-js`
- `starknet-wallet`

The required MCP source is checked out under the ignored local path `.tools/starknet-agentic` at revision `322f32fa7a6a5aa32a22a40bfffe7a50298e82f7`. Its workspace dependencies install and build with the pinned Node and pnpm versions. The local stdio server was started with a non-signing proxy configuration and successfully initialized through MCP, exposing 17 tools. No private key was supplied.

The Codex runtime in this task does not expose that locally built server as a connected MCP namespace. Local build and protocol verification are complete, but live network operations still require an explicit configured MCP connection and a controlled signer boundary.

## Privacy reference

The local router follows the upstream `OpenNoteDeposit` shape of `note_id`, `token`, and `amount`, and returns a `Span<OpenNoteDeposit>` from its privacy-pool invoke entrypoint. That shape was checked against the upstream Starknet privacy source before implementation. No address, proving endpoint, or mainnet transaction is invented here.
