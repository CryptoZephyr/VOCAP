## Role
This file defines operating rules for any coding agent working on VOCAP.
VOCAP is a private programmable-capability protocol for Starknet.
Do not reinterpret it as a payment app, credential system, access-control dashboard or generic STRK20 wrapper.
## Current objective hierarchy
Always prioritize work in this order:
1. Cairo contracts and reusable private capability loop;
2. contract security and asset conservation;
3. backend orchestration, indexing, persistence and transaction lifecycle;
4. private capability transfer/succession;
5. existing-token threshold mode;
6. one real target integration through the backend/API;
7. integration SDK/client ergonomics;
8. UI and visual polish;
9. mainnet deployment and verifiable submission evidence;
10. optional post-V1 expansion.
**Backend-first rule:** do not spend implementation time polishing frontend behavior while contract or backend correctness is incomplete. The frontend is a consumer of authoritative contract/backend state, never a substitute for it.
If a lower-priority task interferes with a higher-priority task, stop the lower-priority work.
## Canonical product rule
> **No required asset, no authorized action.**
For reusable capabilities:
> **Asset supplied → action executes → same asset returns privately.**
Any implementation that violates these rules is invalid.
## Architecture constraints
### STRK20 notes
Treat STRK20 notes as token/value notes.
Do not assume notes can store arbitrary:
- roles;
- metadata;
- credentials;
- product IDs;
- permissions;
- application state.
A capability's meaning comes from the ERC-20 token contract plus the public VOCAP policy.
### Private computation
Do not assume arbitrary private computation.
Do not introduce a design requiring private evaluation of application state unless a concrete shipped mechanism is explicitly verified.
### Proofs
Do not claim the STRK20 prover can prove arbitrary application predicates.
VOCAP does not require custom ownership proofs. The real configured asset is supplied through the STRK20 execution path.
### Viewing keys
Do not use viewing keys as arbitrary credential proofs.
Do not expose private viewing material to the application unnecessarily.
## Router rules
`VocapRouter` must:
- accept authorization execution only from the configured privacy pool;
- validate policy before target execution;
- validate real token/amount receipt;
- bind target and selector;
- reject unrestricted arbitrary target execution;
- use explicit reentrancy protection;
- return reusable assets only after successful target execution;
- fail atomically;
- avoid retaining reusable capability assets after success.
## Capability token rules
For dedicated capability tokens:
- prefer decimals = 0;
- supply semantics must be explicit;
- unique authority uses supply = 1;
- fixed supply must truly be fixed;
- do not leave an undocumented mint authority;
- do not create fake metadata inside STRK20 notes.
## Privacy claims
Allowed claims:
- current holder can remain private while capability stays in STRK20 private state;
- capability transfer can occur privately through STRK20;
- unrelated private balance remains hidden by the STRK20 flow;
- a previous private note becomes unusable after a valid private transfer/spend.
Forbidden claims unless separately proven:
- target action is hidden;
- calldata is hidden;
- timing is hidden;
- all provenance is erased;
- a unique token cannot be correlated at public privacy boundaries;
- VOCAP proves identity;
- VOCAP provides non-transferable credentials;
- VOCAP provides arbitrary selective disclosure.
## Distribution constraints
Do not design the first integration around transferring protocol ownership to VOCAP.
The initial integration should protect one optional, low-risk target function.
Preferred adoption path:
```plain text
existing token threshold
→ dedicated private reusable seat
→ selected operator capability
```
Every new feature should be evaluated against:
- Does this reduce integration friction?
- Can an external application use it without redesigning its whole protocol?
- Does it improve recurring use?
- Does it strengthen the private reusable-right primitive?
If not, defer it.
## Network and funding workflow
VOCAP is Sepolia-first and mainnet-final.
Before implementation begins, the coding agent must produce a conservative **pre-build mainnet funding estimate** using the current fee environment, the minimal expected V1 contract set and the minimum meaningful STRK20 proof sequence. This estimate must be clearly labeled as provisional because exact declaration/deployment fees cannot be known until final compiled artifacts exist.
Development order:
```plain text
pre-build mainnet budget estimate
→ local/Sepolia implementation
→ Sepolia deployment and smoke flows
→ tests + audit + backend/integration stability
→ freeze mainnet artifacts
→ mainnet dry-run/fee estimation
→ exact funding requirement
→ fund only the required amount + small buffer
→ mainnet deployment
→ minimum meaningful proof transactions
```
Do not use mainnet as the iterative development environment.
The pre-build estimate must separate:
- declarations/deployments;
- policy/configuration transactions;
- STRK20 private-transaction fees;
- safety buffer;
- any verified sponsorship/paymaster coverage.
Once compiled artifacts are frozen, replace the provisional estimate with actual dry-run/fee-estimation results before asking for or spending mainnet funds.
## V1 lifecycle scope lock
V1 is `RETURN` only. The coding agent MUST NOT implement `CONSUME` during the mainnet sprint.
Prioritize reusable authorization correctness, private succession, backend replay/indexing, one real integration, mainnet deployment and verifiable transaction evidence.
## Forbidden scope expansion
Do not add unless explicitly requested after the core is complete:
- escrow;
- payroll;
- subscriptions;
- NFT ownership wrappers;
- reputation;
- identity credentials;
- governance product features;
- cross-chain capabilities;
- MPC;
- guardians/recovery;
- private mempool infrastructure;
- FHE;
- AI authorization;
- arbitrary policy scripting;
- marketplace features;
- generic privacy SDK wrappers;
- `CONSUME` capability mode during V1.
## Starknet agent tooling
Coding agents working on VOCAP must install and configure the Starknet-specific agent toolchain before starting implementation. These are required project dependencies for the coding-agent environment, not optional references.
### Required installation before coding
Before editing VOCAP contracts, backend, SDK or wallet integration, the coding agent must verify that the following are installed and available in its environment:
- Starknet Agent Skills: `cairo-contract-authoring`, `cairo-testing`, `cairo-auditor`, `starknet-js`, `starknet-wallet`.
- Starknet MCP server: `@starknetfoundation/starknet-agentic-mcp-server`.
If any required tool is missing, install/configure it first and verify that the coding agent can access it before continuing with implementation. Do not silently fall back to generic model knowledge when the required Starknet tooling has not been installed.
### Required Starknet Agent Skills
Preferred source: `keep-starknet-strange/starknet-agentic`.
The following skills must be installed for VOCAP:
- `cairo-contract-authoring` — primary guidance for Cairo contract structure, interfaces, storage and implementation patterns.
- `cairo-testing` — required for Scarb/Starknet Foundry tests, fuzzing, cheatcodes, fork tests and reproducible contract verification.
- `cairo-auditor` — use after implementation passes tests to perform an adversarial security review of authorization, accounting, reentrancy, privilege and asset-conservation behavior.
- `starknet-js` — use for the Node/TypeScript backend, RPC interaction, transaction submission/status handling, contract reads and typed Starknet integration.
- `starknet-wallet` — use for wallet-facing flows, account interaction, transfers, paymaster/session behavior where relevant.
Optional skills may be added only when a concrete VOCAP task requires them. Do not install unrelated skill packs merely because they exist.
### Skill execution order
For contract work, prefer:
```plain text
VOCAP docs
→ cairo-contract-authoring
→ implementation
→ cairo-testing
→ passing tests
→ cairo-auditor
→ corrections
→ repeat tests
```
For backend/network integration, prefer:
```plain text
VOCAP docs
→ starknet-js
→ backend implementation
→ deterministic integration tests
→ Starknet MCP for verified network operations where useful
```
Skills supplement the canonical VOCAP documentation. They must not override `PRD.md`, `Architecture.md`, `Tasks.md`, `Roadmap.md` or the invariants in this file.
### Starknet MCP
Required MCP package:
```plain text
@starknetfoundation/starknet-agentic-mcp-server
```
The Starknet MCP must be installed and configured in the coding-agent environment before network integration, deployment, smoke testing or live Starknet operations begin. Verify the connected MCP tool schema after installation rather than assuming capabilities.
Use the Starknet MCP as an operational tool layer for supported Starknet actions such as:
- chain/RPC reads;
- balances;
- contract reads and calls;
- transaction inspection;
- transaction submission when explicitly authorized;
- supported transfers/paymaster operations;
- deployment or smoke-test assistance where the configured MCP actually exposes the required operation.
Do not assume an MCP operation exists. Inspect the connected MCP tool schema before depending on it.
### MCP safety rules
- MCP is not a source of protocol truth; confirmed Starknet state remains authoritative.
- Do not place production private keys, viewing keys, capability spend authority or unrestricted signer secrets directly inside an agent prompt, repository or persistent MCP configuration.
- Prefer read/simulation capabilities by default.
- For write operations, use a controlled signer boundary with the minimum required permissions.
- Never allow a coding agent unrestricted production signing merely for convenience.
- Never let MCP output bypass normal transaction confirmation/indexing rules.
- A transaction submitted through MCP is still `pending` until authoritative chain confirmation is observed.
- Record deployed addresses and transaction hashes through the normal backend/deployment state path rather than model memory.
- Do not use MCP to hide unsupported protocol assumptions. If STRK20/VOCAP behavior cannot be proven through the pinned interfaces, stop and verify it.
### Tooling preference by task
```plain text
Cairo implementation      → cairo-contract-authoring
Cairo tests/fuzzing       → cairo-testing
Contract security review  → cairo-auditor
Node/TypeScript backend   → starknet-js
Wallet-facing integration → starknet-wallet
Network reads/smoke ops   → Starknet MCP
Sensitive writes          → controlled signer boundary
```
The coding agent should use the smallest relevant tooling set for the current objective and must not let tooling introduce architecture changes outside the approved VOCAP scope.
## Backend state rules
- Onchain Starknet state is authoritative for protocol facts.
- Postgres is the durable backend projection/store for indexed operational state.
- Backend ingestion must be deterministic, replayable and idempotent.
- Do not use in-memory state as authority.
- Redis, if introduced, is cache/live-delivery only and never source of truth.
- Never store user private keys, viewing keys or capability spend authority in the backend.
- Never mark a transaction successful before authoritative confirmation.
## No mock production state
Backend, frontend and integration code must not present mock data as real state.
Never hardcode:
- balances;
- capability ownership;
- transaction success;
- policy execution success;
- network status.
Mocks are permitted only inside clearly isolated tests or fixtures.
## Error handling
Errors must be explicit and actionable.
Prefer stable errors for:
```plain text
ONLY_POOL
POLICY_DISABLED
WRONG_TOKEN
WRONG_AMOUNT
INVALID_TARGET
INVALID_SELECTOR
TARGET_CALL_FAILED
RETURN_FAILED
REENTRANCY
```
Use project-appropriate Cairo error style, but preserve clear semantics.
Do not swallow failures and show success optimistically.
## Testing requirements
Every material contract change must include tests where relevant.
Minimum security coverage:
- direct caller bypass;
- wrong asset;
- wrong amount;
- disabled policy;
- wrong selector;
- wrong target;
- target revert;
- reentrancy;
- capability conservation;
- reusable return;
- unexpected token balance;
- replay/double-use;
- private succession flow.
## Implementation workflow
Before editing:
1. read `PRD.md`;
2. read `Memory.md`;
3. read `Architecture.md`;
4. read `Tasks.md`;
5. inspect current code rather than assuming file structure.
For every task:
```plain text
CURRENT OBJECTIVE
→ exact files
→ required invariant
→ backend/onchain source of truth
→ implementation
→ tests
→ run verification
→ report exact result
```
For backend work, explicitly identify persistence, idempotency, replay behavior and transaction-state transitions before implementation.
Do not perform broad unrelated refactors.
## Code quality
- no placeholders in production paths;
- no TODO-only implementations for required behavior;
- no duplicated source-of-truth configuration;
- no hardcoded secret values;
- no unsafe `any` where typed interfaces are practical;
- no dead buttons;
- no silent failure paths;
- no speculative protocol behavior described as fact.
## Dependency rule
Before depending on a STRK20 SDK method, contract interface or service behavior:
1. verify it exists in the pinned version;
2. verify expected network compatibility;
3. verify actual parameter/return shape;
4. avoid designing against unreleased or assumed behavior.
If documentation and code disagree, treat the implementation as unresolved until verified.
## Decision rule for technical blockers
If the desired feature appears to require unsupported STRK20 behavior:
- do not fake it;
- do not add offchain trust and pretend the property is onchain;
- do not invent a custom proof system by default;
- reduce the feature to shipped primitives or explicitly mark it deferred.
## Completion standard
The reusable core is complete only when an automated or reproducible smoke flow proves:
```plain text
Alice private capability
→ authorized target action
→ capability returned privately
→ Alice uses it again
→ Alice transfers capability privately to Bob
→ Alice's old note is unusable
→ Bob uses capability successfully
```
Everything else is secondary until this passes. After the reusable sequence, backend replay/indexing and one integration smoke flow are stable, prioritize mainnet deployment and submission evidence. `CONSUME` remains post-V1.
