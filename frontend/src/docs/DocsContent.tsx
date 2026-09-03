import {ArrowUpRight} from "@phosphor-icons/react";
import {DEPLOYMENTS, type DeploymentConfig} from "../protocol/config.ts";
import {MAINNET_EVIDENCE, MAINNET_EXECUTIONS, mainnetTransactionHref} from "../protocol/mainnet-evidence.ts";
import {Callout, CodeBlock, DefinitionGrid, DocPage, Flow, Section, type TocItem} from "./DocsComponents.tsx";
import type {DocsSlug} from "./docs-navigation.ts";

const toc = (...pairs: [string, string][]): TocItem[] => pairs.map(([id, label]) => ({id, label}));
const INSTALL = "npm install vocap-client@0.1.0 starknet@10.5.0";
const CONFIG = `import { hash } from "starknet";

export const vocapConfig = {
  network: "sepolia" as const,
  routerAddress: "${DEPLOYMENTS.sepolia.routerAddress}",
  poolAddress: "${DEPLOYMENTS.sepolia.poolAddress}",
  policyId: "1",
  tokenAddress: "${DEPLOYMENTS.sepolia.capabilityTokenAddress}",
  amount: 1_000_000_000_000_000_000n,
  targetAddress: "${DEPLOYMENTS.sepolia.targetAddress}",
  selector: hash.getSelectorFromName("premium_action"),
  targetCalldata: [],
};`;
const QUICKSTART = `import { createVocapClient } from "vocap-client";
import { vocapConfig } from "./vocap.config.js";

const vocap = createVocapClient(vocapConfig);

console.log(vocap.network, vocap.routerAddress);`;

function StartPage() {
  return <DocPage eyebrow="01 · Start" title="Private permissions carried by real assets." description="VOCAP lets a private STRK20 note authorize one configured Starknet action. Start with the mental model, then prepare the client." toc={toc(["introduction", "What VOCAP is"], ["quickstart", "Five-minute quickstart"], ["how", "How it works"], ["next", "Where to go next"])}>
    <Section id="introduction" title="What VOCAP is"><p>VOCAP is authorization infrastructure for applications that need a reusable permission without publishing the current holder. A private STRK20 note carries the capability. A public Router policy limits it to one token, amount, target, selector, mode, and pool caller.</p><DefinitionGrid items={[{term: "Problem", definition: "Wallet addresses and public role maps reveal who can act."}, {term: "Mental model", definition: "Your asset is your permission."}, {term: "Core invariant", definition: "No required capability asset, no authorized action."}, {term: "V1 scope", definition: "One policy-bound action with RETURN. Target execution remains public."}]} /></Section>
    <Section id="quickstart" title="Five-minute quickstart"><p>Install the client, copy the reviewed <a href="/docs/build#configure">Sepolia config</a>, then create VOCAP. This wallet-free check makes no transaction and doesn’t depend on the projection service.</p><CodeBlock label="Install">{INSTALL}</CodeBlock><CodeBlock label="quickstart.mjs">{QUICKSTART}</CodeBlock><Callout title="Expected result"><p>The script prints <code>sepolia</code> followed by the configured Router address. Continue to the build guide when you’re ready to connect private-note discovery and a user wallet.</p></Callout></Section>
    <Section id="how" title="How it works"><Flow steps={[{label: "Private capability", detail: "The browser discovers a private STRK20 note for the configured token and amount."}, {label: "Policy boundary", detail: "The pool calls VocapRouter, which checks policy 1 and the return note."}, {label: "Approved execution", detail: "The Router calls premium_action() on the configured target."}, {label: "Fresh private state", detail: "The same amount returns to the pool for a new private note."}]} /></Section>
    <Section id="next" title="Where to go next"><p>Read <a href="/docs/concepts">Core concepts</a> for the vocabulary. Use <a href="/docs/build">Build the private flow</a> for wallet approval, proof submission, receipt confirmation, and returned-note discovery.</p></Section>
  </DocPage>;
}

function ConceptsPage() {
  return <DocPage eyebrow="02 · Concepts" title="The capability, policy, and RETURN lifecycle." description="Learn what each piece means before wiring the private flow into an application." toc={toc(["primitives", "Core primitives"], ["policy", "Policy model"], ["lifecycle", "RETURN lifecycle"], ["succession", "Private succession"], ["privacy", "Privacy model"])}>
    <Section id="primitives" title="Core primitives"><DefinitionGrid items={[{term: "Capability note", definition: "A private STRK20 note holding the exact token and amount required by a policy."}, {term: "VocapRouter", definition: "The public contract that checks the configured boundary before calling the target."}, {term: "Policy", definition: "The Router record for token, amount, target, selector, enabled state, caller, and RETURN mode."}, {term: "Return note", definition: "The fresh open note prepared before execution so the same value can return to private state."}]} /></Section>
    <Section id="policy" title="Policy model"><p>Policy 1 allows exactly 1 STRK to authorize <code>premium_action()</code> on the approved target. V1 target calldata is empty. The privacy pool is the required Router caller.</p><Callout kind="warning" title="Common misunderstanding"><p>The asset authorizes the one action encoded in the enabled policy. It doesn’t grant arbitrary contract access.</p></Callout></Section>
    <Section id="lifecycle" title="RETURN lifecycle"><Flow steps={[{label: "Discover", detail: "Find the current private capability note in the browser."}, {label: "Supply", detail: "Withdraw the exact amount to the Router and prepare one fresh open note."}, {label: "Execute", detail: "The pool calls privacy_invoke and the Router validates every policy field."}, {label: "Return", detail: "The target runs and the same capability amount returns for the next private note."}]} /></Section>
    <Section id="succession" title="Private succession"><p>The sender spends the current note and the recipient receives a new private note. Recipient-side discovery confirms possession. Public receipts can show later Router activity, but they don’t reveal private ownership or prove the transfer on their own.</p></Section>
    <Section id="privacy" title="Privacy model"><DefinitionGrid items={[{term: "Private or local", definition: "Viewing key, note witnesses, private registry, proof-signing material, and current holder state."}, {term: "Public", definition: "Pool call, timing, Router checks, target action, status, fees, and finalized events."}, {term: "Never claimed", definition: "Hidden execution, hidden timing, generic ownership proof, or unlinkability against every observer."}]} /></Section>
  </DocPage>;
}

function BuildPage() {
  return <DocPage eyebrow="03 · Build" title="Build the private action end to end." description="The privacy SDK owns discovery and proof construction. The VOCAP client validates the boundary, and the connected wallet authorizes the write." toc={toc(["prerequisites", "Prerequisites"], ["configure", "Configure"], ["workflow", "Workflow"], ["confirm", "Confirm success"], ["refresh", "Refresh state"])}>
    <Section id="prerequisites" title="Prerequisites"><ul><li>Node.js 20 or later and <code>starknet@10.5.x</code>.</li><li>The pinned STRK20 SDK <code>PRIVACY-0.14.3-RC.2</code>.</li><li>A connected Starknet wallet on the selected network.</li><li>A valid viewing key and discoverable private capability note.</li><li>Enough STRK for current network and privacy-pool fees.</li></ul></Section>
    <Section id="configure" title="Configure one reviewed deployment"><p>Save the public Sepolia values once, then import them wherever you create the client.</p><CodeBlock label="vocap.config.ts">{CONFIG}</CodeBlock><Callout kind="warning" title="Refresh before writing"><p>Deployment records are reference data. Refresh chain state, allowance, fees, and service compatibility immediately before any write.</p></Callout></Section>
    <Section id="workflow" title="The implementation workflow"><Flow steps={[{label: "Initialize", detail: "Create the privacy SDK and VOCAP client for the same deployment."}, {label: "Discover", detail: "Use the viewing key locally to find the capability note."}, {label: "Build", detail: "Withdraw one exact amount and prepare one open return note."}, {label: "Prove", detail: "Let the pinned SDK produce the apply_actions call and proof."}, {label: "Validate", detail: "Reject pool, calldata, proof, or policy mismatches."}, {label: "Approve", detail: "The connected wallet shows and signs the final transaction."}, {label: "Confirm", detail: "Wait for an accepted receipt and matching PolicyExecuted event."}, {label: "Rediscover", detail: "Find the fresh returned note before reuse."}]} /></Section>
    <Section id="confirm" title="Confirm authoritative success"><p>A submitted hash is pending evidence. Success requires an accepted chain receipt and a matching <code>PolicyExecuted</code> event from the configured Router. A backend row is a delayed projection.</p></Section>
    <Section id="refresh" title="Refresh the resulting state"><p>After RETURN, rediscover notes with the privacy SDK. Don’t reuse the spent input note or infer the new note from a public event.</p></Section>
  </DocPage>;
}

function IntegratePage() {
  return <DocPage eyebrow="04 · Integrate" title="Put VOCAP inside a real application." description="The application chooses the protected action, the privacy SDK owns private state, and the Router enforces public policy." toc={toc(["ownership", "Responsibility map"], ["client", "Official client"], ["target", "Target integration"], ["policies", "Policies"], ["advanced", "Advanced flow"])}>
    <Section id="ownership" title="Responsibility map"><DefinitionGrid items={[{term: "Application", definition: "Owns the user journey, selected deployment, and approval timing."}, {term: "Privacy SDK", definition: "Discovers notes, keeps viewing material, builds transfers, and produces proof data."}, {term: "VOCAP client", definition: "Builds the callback, validates the proven pool call, submits through the wallet, and reads projections."}, {term: "VocapRouter", definition: "Checks the policy and enforces exact asset return around the target call."}, {term: "Backend", definition: "Indexes finalized public receipts. It never signs or receives viewing keys."}]} /></Section>
    <Section id="client" title="Official client"><CodeBlock>{`const prepared = vocap.prepareWalletCall(sdkResult);
// Show the user what will be submitted.

const { transactionHash } = await vocap.submitPrivateResult(
  walletAccount,
  sdkResult,
);`}</CodeBlock></Section>
    <Section id="target" title="Protect a target action"><p>The target contract must explicitly trust the Router. The reviewed V1 target exposes <code>premium_action()</code> with no arguments and rejects other callers. Review any new target and policy together.</p></Section>
    <Section id="policies" title="Work with policies"><p>A policy binds token, amount, target, selector, enabled state, mode, and pool caller. Only the Router owner creates or enables policies. Disabling a policy blocks future execution without changing private note ownership.</p></Section>
    <Section id="advanced" title="Reuse and succession"><p>Reuse starts by rediscovering the fresh RETURN note. Succession spends the sender’s note and creates one for the recipient. Keep this workflow inside the privacy SDK.</p></Section>
  </DocPage>;
}

const methods = [["buildPrivacyInvokeCall(noteId)", "Build Router calldata for a known open-note ID."], ["createInvokeCallBuilder()", "Create the callback used by the privacy SDK invoke builder."], ["prepareWalletCall(result, options?)", "Validate apply_actions, proof data, facts, and expected pool."], ["submitPrivateResult(account, result, options?)", "Validate and submit through the connected wallet."], ["getPolicy()", "Read the configured policy projection."], ["listExecutions(query?)", "Read accepted public executions."], ["getTransaction(txHash)", "Read a registered transaction lifecycle row."], ["registerRouterExecution(txHash)", "Register one Router execution hash for projection."]] as const;

function Deployment({network, config, status}: {network: string; config: DeploymentConfig; status: string}) {
  return <article className="docs-deployment"><div><h3>{network}</h3><span>{status}</span></div><dl><div><dt>Router</dt><dd><code>{config.routerAddress}</code></dd></div><div><dt>Pool</dt><dd><code>{config.poolAddress}</code></dd></div><div><dt>Target</dt><dd><code>{config.targetAddress}</code></dd></div><div><dt>Policy</dt><dd>1 · 1 STRK · RETURN</dd></div><div><dt>Pool fee record</dt><dd>{config.poolFeeStrk} STRK</dd></div><div><dt>Evidence updated</dt><dd>{config.evidenceUpdatedAt}</dd></div></dl></article>;
}

function ReferencePage() {
  return <DocPage eyebrow="05 · Reference" title="Precise lookup for the public surface." description="Client methods, contract entrypoints, events, backend routes, errors, and deployment values in one place." toc={toc(["client", "Client API"], ["contracts", "Contracts"], ["events", "Events"], ["backend", "Backend API"], ["errors", "Errors"], ["deployments", "Deployments"])}>
    <Section id="client" title="Client API"><div className="docs-api-list">{methods.map(([signature, purpose]) => <article key={signature}><code>{signature}</code><p>{purpose}</p></article>)}</div><p>Standalone exports include the same builders and submission helpers, plus <code>createVocapClient</code> and <code>VocapApiError</code>.</p></Section>
    <Section id="contracts" title="Contracts"><DefinitionGrid items={[{term: "privacy_invoke", definition: "Pool-only execution. Validates policy and return note, calls the target, then returns the exact amount."}, {term: "create_policy", definition: "Owner-only policy creation."}, {term: "set_policy_enabled", definition: "Owner-only enable or disable switch."}, {term: "get_policy / get_owner / get_pool", definition: "Read policy, administration, and pool state."}, {term: "premium_action", definition: "Reviewed target action, callable only by its Router."}]} /></Section>
    <Section id="events" title="Events"><DefinitionGrid items={[{term: "PolicyCreated", definition: "Proves a public policy was recorded. It doesn’t prove private ownership."}, {term: "PolicyEnabled", definition: "Proves the owner changed enabled state."}, {term: "PolicyExecuted", definition: "Proves a policy-bound Router execution. It doesn’t identify the private holder."}]} /></Section>
    <Section id="backend" title="Backend API"><div className="docs-api-list">{[["GET /api/v1/policies", "network, routerAddress, policyId"], ["GET /api/v1/executions", "deployment scope, optional policyId, limit 1-100, cursor"], ["GET /api/v1/transactions", "deployment scope and txHash"], ["POST /api/v1/transactions", "registers only router_execution and returns 202"]].map(([route, detail]) => <article key={route}><code>{route}</code><p>{detail}</p></article>)}</div><Callout title="Authority"><p>API responses are indexed projections. Finalized chain receipts are authoritative.</p></Callout></Section>
    <Section id="errors" title="Error reference"><div className="docs-error-table">{[["VOCAP_PRIVATE_FLOW_POOL_MISMATCH", "Proof targets another pool.", "Rebuild from one deployment."], ["VOCAP_PRIVATE_FLOW_PROOF_REQUIRED", "Proof data is missing.", "Complete the SDK proof step."], ["VOCAP_OPEN_NOTE_ID_MISMATCH", "Return note ID is zero.", "Prepare one valid open note."], ["VOCAP_API_BASE_URL_REQUIRED", "backendUrl is missing.", "Configure the projection URL."], ["VOCAP_API_INVALID_LIMIT", "Limit is outside 1-100.", "Use an integer from 1 to 100."], ["unsupported_deployment", "Backend doesn’t serve this scope.", "Use its configured deployment."], ["service_unavailable", "Indexer isn’t ready.", "Retry and verify onchain."]].map(([code, meaning, fix]) => <div key={code}><code>{code}</code><p>{meaning}</p><span>{fix}</span></div>)}</div></Section>
    <Section id="deployments" title="Deployments"><Deployment network="Mainnet" config={DEPLOYMENTS.mainnet} status="Read-only evidence" /><Deployment network="Sepolia" config={DEPLOYMENTS.sepolia} status="Playground writes enabled, fresh checks required" /></Section>
  </DocPage>;
}

function ProductionPage() {
  return <DocPage eyebrow="06 · Production and proof" title="What is live, and what the evidence proves." description="VOCAP has a recorded Mainnet RETURN lifecycle. Public receipts don’t prove private holder identity." toc={toc(["deployment", "Current deployment"], ["executions", "Verified executions"], ["boundary", "Evidence boundary"], ["trace", "Capability Trace"])}>
    <Section id="deployment" title="Current Mainnet deployment"><Deployment network={MAINNET_EVIDENCE.network} config={DEPLOYMENTS.mainnet} status="Deployed, evidence-only interface" /></Section>
    <Section id="executions" title="Three verified executions"><div className="docs-proof-list">{MAINNET_EXECUTIONS.map((execution) => <article key={execution.id}><div><span>{execution.id}</span><strong>{execution.title}</strong></div><p>{execution.role} label · block {execution.blockNumber.toLocaleString()} · {execution.receiptStatus} · {execution.finality}</p><code>{execution.transactionHash}</code><a href={mainnetTransactionHref(execution.transactionHash)} target="_blank" rel="noreferrer">Open Starkscan receipt <ArrowUpRight size={14} /></a></article>)}</div></Section>
    <Section id="boundary" title="Evidence boundary"><DefinitionGrid items={[{term: "Directly proven", definition: "Transaction, finality, block, fee, public calls, and Router event."}, {term: "Lifecycle context", definition: "The records align with first use, returned reuse, and later Bob-labelled execution."}, {term: "Not inferable", definition: "Current private holder, viewing key, note witness, or private transfer itself."}]} /></Section>
    <Section id="trace" title="Inspect the trace"><p>The <a href="/playground">Capability Trace</a> presents all three records and direct explorer links. It never submits a Mainnet write.</p></Section>
  </DocPage>;
}

function SecurityPage() {
  return <DocPage eyebrow="07 · Security" title="Trust, privacy, and failure boundaries." description="VOCAP uses narrow public policy, local secret handling, wallet authorization, and fail-closed validation." toc={toc(["trust", "Trust model"], ["data", "Data boundary"], ["failure", "Failure behavior"], ["limits", "Limits"])}>
    <Section id="trust" title="Trust model"><DefinitionGrid items={[{term: "User and wallet", definition: "Control keys, approve writes, and pay current fees."}, {term: "Privacy SDK and services", definition: "Own discovery, proof construction, and service availability."}, {term: "STRK20 pool", definition: "Owns the private note lifecycle and is the only accepted Router caller."}, {term: "VocapRouter", definition: "Enforces policy and exact asset return."}, {term: "Indexer", definition: "Can delay a projection. It can’t authorize a chain action."}]} /></Section>
    <Section id="data" title="Private and public data"><DefinitionGrid items={[{term: "Keep local", definition: "Private key, viewing key, witnesses, registry, and proof-signing material."}, {term: "Public by design", definition: "Pool calls, timing, policy, target call, transaction result, fees, and events."}, {term: "Correlatable", definition: "Observers can correlate public timing, calls, amounts, targets, and side effects."}]} /></Section>
    <Section id="failure" title="Failure behavior"><div className="docs-error-table">{[["Validation mismatch", "Client or Router rejects before target execution."], ["Stale private state", "Refresh discovery and don’t reuse a spent note."], ["Wallet rejection", "No transaction is submitted."], ["Rejected receipt", "Treat the action as failed."], ["Projection delay", "Read the chain receipt directly."], ["Duplicate registration", "Projection registration isn’t a second execution."]].map(([symptom, behavior]) => <div key={symptom}><code>{symptom}</code><p>{behavior}</p></div>)}</div></Section>
    <Section id="limits" title="Claims and limits"><Callout kind="warning" title="V1 limits"><p>VOCAP doesn’t hide target execution or timing. It doesn’t prove human identity, general asset ownership, or universal unlinkability. V1 supports RETURN only and empty target calldata.</p></Callout></Section>
  </DocPage>;
}

function HelpPage() {
  const issues = [["Policy read returns 503", "The projection service isn’t ready.", "Verify the Router on Starkscan or retry later."], ["No capability appears", "Viewing key, network, token, registry, or note state may differ.", "Verify the deployment and run fresh local discovery."], ["Pool mismatch", "The proof was built for another pool.", "Recreate both clients from one deployment."], ["A hash exists but nothing changed", "Submission isn’t finality.", "Wait for the receipt and PolicyExecuted event."], ["Returned capability can’t be reused", "The browser holds stale note state.", "Rediscover and use the fresh note."]] as const;
  return <DocPage eyebrow="08 · Help" title="Troubleshoot the real integration path." description="Start with the symptom, verify the boundary that owns it, then use the smallest safe fix." toc={toc(["troubleshooting", "Troubleshooting"], ["faq", "FAQ"], ["source", "Source and evidence"])}>
    <Section id="troubleshooting" title="Troubleshooting"><div className="docs-troubleshooting">{issues.map(([symptom, cause, fix]) => <article key={symptom}><h3>{symptom}</h3><p><strong>Likely cause</strong>{cause}</p><p><strong>How to fix</strong>{fix}</p></article>)}</div></Section>
    <Section id="faq" title="Frequently asked questions"><div className="docs-faq">{[["What does the capability authorize?", "One configured target and selector under an enabled policy."], ["What stays private?", "The holder and private note material can stay private. Public execution remains visible."], ["Who approves a write?", "The connected user wallet. VOCAP has no server signer."], ["Can it be reused?", "Yes, after RETURN and fresh private-note discovery."], ["Is Mainnet ready for another write?", "The recorded lifecycle is evidence. A future write needs fresh wallet, allowance, fee, service, proof-state, and chain-state checks."], ["Where is the proof?", "Use the Capability Trace and its three Starkscan receipts."]].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></Section>
    <Section id="source" title="Source and evidence"><p>VOCAP is open source under the MIT License. Read the <a href="https://github.com/CryptoZephyr/VOCAP" target="_blank" rel="noreferrer">GitHub repository</a> or open the <a href="/playground">Capability Trace</a>.</p></Section>
  </DocPage>;
}

export const DOCS_PAGES: Record<DocsSlug, () => React.JSX.Element> = {start: StartPage, concepts: ConceptsPage, build: BuildPage, integrate: IntegratePage, reference: ReferencePage, production: ProductionPage, security: SecurityPage, help: HelpPage};
