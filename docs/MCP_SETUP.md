# Starknet MCP setup

The required package is installed and built locally outside the application repository at:

`starknet-agentic/packages/starknet-mcp-server`

The package name is `@starknetfoundation/starknet-agentic-mcp-server`, version `0.1.1`. Its WSL build completed successfully. The local stdio schema was previously verified with 17 tools.

Codex uses a `starknet_vocap` MCP entry. It launches WSL through a local wrapper outside this repository.

The wrapper reads the signer boundary from a local file outside this repository.

On Windows, the default location is `%USERPROFILE%\\.config\\vocap\\starknet-mcp.env`.

Add a disposable Sepolia account address and its private key to that file before restarting Codex. Keep the key outside this repository and out of chat, logs, prompts and persistent project configuration.

The configured direct signer mode is for local Sepolia testing only. A production or mainnet setup requires a controlled proxy signer instead. The MCP must pass read-only checks before any write operation is attempted.
