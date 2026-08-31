import { useEffect, useMemo, useState } from "react";
import type { PrivateTransfersInterface } from "@starkware-libs/starknet-privacy-sdk";
import { LOGO_ALT, LOGO_PUBLIC_PATH } from "./brand.ts";
import { Button } from "@/components/ui/button.tsx";
import { handleInternalClick } from "./navigate.ts";
import { ROUTES } from "./routes.ts";
import { DEPLOYMENTS, MAINNET_EXECUTION_HASHES, type VocapNetwork } from "./protocol/config.ts";
import { verifyDeployment, verifyExecutionReceipt, type VerifiedPolicy } from "./protocol/contracts.ts";
import { registerTransaction } from "./protocol/api.ts";
import { connectWallet, disconnectWallet, type ConnectedWallet } from "./protocol/wallet.ts";
import {
  buildReturnProof,
  createTransfers,
  discoverCapability,
  submitPrivateResult,
  transferCapability,
} from "./protocol/private-flow.ts";

type FlowPhase = "idle" | "discovering" | "ready" | "proving" | "approval" | "pending" | "accepted" | "rejected" | "reverted";

const phaseCopy: Record<FlowPhase, string> = {
  idle: "Connect a Sepolia wallet and discover private notes.",
  discovering: "Refreshing private note discovery in this browser session.",
  ready: "A capability note is available for the approved action.",
  proving: "Building the private RETURN proof.",
  approval: "Approve the pool call in your connected wallet.",
  pending: "Submitted. Waiting for an accepted receipt and the matching PolicyExecuted event.",
  accepted: "Accepted onchain. The expected PolicyExecuted event was confirmed.",
  rejected: "The receipt did not prove the expected policy execution.",
  reverted: "The transaction reverted.",
};

const short = (value: string) => `${value.slice(0, 8)}…${value.slice(-6)}`;
const messageOf = (error: unknown) => error instanceof Error ? error.message : String(error);

/**
 * Development-only Sepolia write surface. The public /playground route uses
 * CapabilityTracePage and never imports this wallet flow.
 */
export function SepoliaWriteHarnessPage() {
  const [network, setNetwork] = useState<VocapNetwork>("sepolia");
  const config = DEPLOYMENTS[network];
  const [policy, setPolicy] = useState<VerifiedPolicy | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [viewingKey, setViewingKey] = useState("");
  const [transfers, setTransfers] = useState<PrivateTransfersInterface | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [registrationWarning, setRegistrationWarning] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setPolicy(null);
    setVerificationError(null);
    verifyDeployment(config).then((result) => {
      if (!current) return;
      if (result.ok) setPolicy(result.policy);
      else setVerificationError(result.error);
    });
    return () => { current = false; };
  }, [config]);

  useEffect(() => {
    setWallet(null);
    setTransfers(null);
    setViewingKey("");
    setBalance(null);
    setPhase("idle");
    setFlowError(null);
    setTxHash(null);
  }, [network]);

  const canWrite = config.writesEnabled && Boolean(policy && wallet && transfers && balance !== null && balance >= config.amount);
  const amountLabel = useMemo(() => `${Number(config.amount) / 1e18} STRK`, [config.amount]);

  async function onConnect() {
    setFlowError(null);
    try {
      const next = await connectWallet(config);
      if (BigInt(next.chainId) !== BigInt(config.chainId)) throw new Error(`Switch the wallet to ${config.label}.`);
      setWallet(next);
    } catch (error) {
      setFlowError(messageOf(error));
    }
  }

  async function onDisconnect() {
    await disconnectWallet();
    setWallet(null);
    setTransfers(null);
    setViewingKey("");
    setBalance(null);
    setPhase("idle");
  }

  async function onDiscover() {
    if (!wallet || !viewingKey) return;
    setFlowError(null);
    setPhase("discovering");
    try {
      const nextTransfers = createTransfers(wallet.account as never, viewingKey, config);
      const discovery = await discoverCapability(nextTransfers, config);
      setTransfers(nextTransfers);
      setBalance(discovery.total);
      setPhase(discovery.total >= config.amount ? "ready" : "idle");
      if (discovery.total < config.amount) setFlowError(`No ${amountLabel} capability note was discovered for this viewing key.`);
    } catch (error) {
      setPhase("idle");
      setFlowError(messageOf(error));
    }
  }

  async function onExecute() {
    if (!wallet || !transfers || !canWrite) return;
    setFlowError(null);
    setRegistrationWarning(null);
    setTxHash(null);
    try {
      setPhase("proving");
      const result = await buildReturnProof(transfers, wallet.address, config);
      setPhase("approval");
      const submitted = await submitPrivateResult(wallet.account, result, config.poolAddress);
      setTxHash(submitted.transactionHash);
      setPhase("pending");
      try {
        await registerTransaction(config, submitted.transactionHash);
      } catch (error) {
        setRegistrationWarning(`Indexer registration failed: ${messageOf(error)} Chain verification will continue.`);
      }
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const receipt = await verifyExecutionReceipt(config, submitted.transactionHash);
        if (receipt.status === "accepted") {
          setPhase("accepted");
          const rediscovered = await discoverCapability(transfers, config);
          setBalance(rediscovered.total);
          return;
        }
        if (receipt.status === "rejected" || receipt.status === "reverted") {
          setPhase(receipt.status);
          setFlowError(receipt.reason);
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
      }
      setFlowError("The receipt is still pending. Use the explorer link to continue tracking it.");
    } catch (error) {
      setPhase("rejected");
      setFlowError(messageOf(error));
    }
  }

  async function onTransfer() {
    if (!wallet || !transfers || !canWrite || !recipient) return;
    setFlowError(null);
    try {
      setPhase("proving");
      const result = await transferCapability(transfers, recipient, config);
      setPhase("approval");
      const submitted = await submitPrivateResult(wallet.account, result, config.poolAddress);
      setTxHash(submitted.transactionHash);
      setPhase("pending");
      setFlowError("Private transfer submitted. Ownership stays private, so confirm succession by rediscovering with the recipient viewing key.");
    } catch (error) {
      setPhase("rejected");
      setFlowError(messageOf(error));
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-10">
        <a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)}><img className="size-16 object-contain mix-blend-multiply" src={LOGO_PUBLIC_PATH} alt={LOGO_ALT} width={64} height={64} /></a>
        <Button variant="link" nativeButton={false} render={<a href={ROUTES.home} onClick={(event) => handleInternalClick(event, ROUTES.home)} />}>Back to VOCAP</Button>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.05fr_.95fr] md:px-10 md:py-16">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[.2em] text-primary">Sepolia write harness</p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">Use one private capability. Keep the next holder hidden.</h1>
          <p className="mt-5 max-w-[62ch] text-muted-foreground">The browser discovers your note, builds a RETURN proof, asks your wallet to submit the pool call, and waits for the exact Router event before showing success.</p>

          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
            {[['Policy', `#${config.policyId}`], ['Capability', amountLabel], ['Action', `${config.actionName}()`], ['Pool fee', `${config.poolFeeStrk} STRK`]].map(([label, value]) => (
              <div className="bg-background p-4" key={label}><p className="font-mono text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1">{value}</p></div>
            ))}
          </div>

          <div className="mt-6 border border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-mono text-xs uppercase text-muted-foreground">Live deployment check</p><p className="mt-1">{policy ? `Verified ${new Date(policy.verifiedAt).toLocaleTimeString()}` : verificationError || "Reading Router, pool, policy, and target…"}</p></div>
              <span className={`size-3 rounded-full ${policy ? 'bg-emerald-600' : verificationError ? 'bg-red-600' : 'animate-pulse bg-primary'}`} aria-hidden="true" />
            </div>
            {policy && <p className="mt-3 font-mono text-xs text-muted-foreground">Router {short(config.routerAddress)} · target count {policy.actionCount.toString()}</p>}
          </div>

          {network === "mainnet" && <div className="mt-6 border border-primary p-5"><p>Mainnet is evidence-only here. The canonical pool fee is {config.poolFeeStrk} STRK, and the last recorded Router allowance is zero. This interface won’t submit Mainnet writes.</p><div className="mt-4 flex flex-wrap gap-3">{MAINNET_EXECUTION_HASHES.map((hash) => <a className="font-mono text-xs underline underline-offset-4" key={hash} href={`${config.explorerUrl}/tx/${hash}`} target="_blank" rel="noreferrer">Proof {short(hash)}</a>)}</div></div>}
        </div>

        <div className="border border-border bg-muted/40 p-5 md:p-7">
          <label className="font-mono text-xs uppercase tracking-wider" htmlFor="network">Network</label>
          <select id="network" value={network} onChange={(event) => setNetwork(event.target.value as VocapNetwork)} className="mt-2 w-full border border-border bg-background p-3">
            <option value="sepolia">Sepolia playground</option><option value="mainnet">Mainnet evidence</option>
          </select>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-6">
            <div><p className="font-mono text-xs uppercase text-muted-foreground">Wallet</p><p className="mt-1 break-all text-sm">{wallet ? short(wallet.address) : "Not connected"}</p></div>
            <Button onClick={wallet ? onDisconnect : onConnect} disabled={!policy}>{wallet ? "Disconnect" : "Connect wallet"}</Button>
          </div>

          {wallet && config.writesEnabled && <div className="mt-6">
            <label className="font-mono text-xs uppercase tracking-wider" htmlFor="viewing-key">Viewing key</label>
            <input id="viewing-key" type="password" autoComplete="off" value={viewingKey} onChange={(event) => setViewingKey(event.target.value)} placeholder="Session only" className="mt-2 w-full border border-border bg-background p-3" />
            <p className="mt-2 text-xs text-muted-foreground">Used only by the privacy SDK in this browser session. VOCAP doesn’t store it or send it to the backend.</p>
            <Button className="mt-4 w-full" variant="outline" onClick={onDiscover} disabled={!viewingKey || phase === "discovering"}>{phase === "discovering" ? "Discovering…" : "Discover capability"}</Button>
          </div>}

          <div className="mt-6 border-t border-border pt-6" aria-live="polite">
            <p className="font-mono text-xs uppercase text-muted-foreground">Lifecycle</p>
            <p className="mt-2 text-lg">{network === "mainnet" && phase === "idle" ? "Mainnet stays read-only. Review the verified deployment and evidence receipts above." : phaseCopy[phase]}</p>
            {balance !== null && <p className="mt-2 font-mono text-xs">Discovered balance: {Number(balance) / 1e18} STRK</p>}
            {flowError && <p className="mt-3 text-sm text-red-700">{flowError}</p>}
            {registrationWarning && <p className="mt-3 text-sm text-amber-800">{registrationWarning}</p>}
            {txHash && <a className="mt-3 block break-all font-mono text-xs underline underline-offset-4" href={`${config.explorerUrl}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction {txHash}</a>}
          </div>

          {config.writesEnabled && <>
            <Button className="mt-6 w-full" size="lg" onClick={onExecute} disabled={!canWrite || ["proving", "approval", "pending"].includes(phase)}>Use capability and return it</Button>
            <div className="mt-8 border-t border-border pt-6">
              <label className="font-mono text-xs uppercase tracking-wider" htmlFor="recipient">Private succession recipient</label>
              <input id="recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x… recipient address" className="mt-2 w-full border border-border bg-background p-3" />
              <Button className="mt-3 w-full" variant="outline" onClick={onTransfer} disabled={!canWrite || !recipient}>Transfer capability privately</Button>
              <p className="mt-2 text-xs text-muted-foreground">The chain proves the pool action. It doesn’t reveal or infer the private holder.</p>
            </div>
          </>}
        </div>
      </section>
    </main>
  );
}

export const PlaygroundPage = SepoliaWriteHarnessPage;
