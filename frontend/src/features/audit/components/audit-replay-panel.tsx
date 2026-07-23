"use client";

import { useEffect, useRef, useState } from "react";

import type { ControlledShoppingState } from "../../action-gate/types";
import type { TaskContract } from "../../contracts/types";
import { appendAudit, exportAudit, startAudit, verifyAudit } from "../api";
import type { AuditArtifact, AuditExport, AuditSession, AuditVerification } from "../types";

type Props = Readonly<{ contract: TaskContract | null; controlledState: ControlledShoppingState | null; latestArtifact: AuditArtifact | null }>;

const preview = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-6)}`;

export function AuditReplayPanel({ contract, controlledState, latestArtifact }: Props) {
  const [session, setSession] = useState<AuditSession | null>(null);
  const [verification, setVerification] = useState<AuditVerification | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<AuditArtifact | null>(null);
  const [exported, setExported] = useState<AuditExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const attempted = useRef<string | null>(null);

  async function record(artifact: AuditArtifact, currentSession: AuditSession) {
    setWarning(null);
    try { const updated = await appendAudit(currentSession, artifact); setSession(updated); setPendingRetry(null); }
    catch { setWarning("Audit recording failed. The completed operation was not repeated or changed."); setPendingRetry(artifact); }
  }

  useEffect(() => {
    if (!session || !latestArtifact || attempted.current === latestArtifact.artifact_key) return;
    attempted.current = latestArtifact.artifact_key;
    void record(latestArtifact, session);
  }, [latestArtifact, session]);

  async function start() { if (!contract || !controlledState) return; setLoading(true); setWarning(null); try { setSession(await startAudit(contract, controlledState)); setVerification(null); setReplayIndex(null); attempted.current = null; } catch { setWarning("Unable to start the audit session."); } finally { setLoading(false); } }
  async function verify() { if (!session) return; setLoading(true); try { setVerification(await verifyAudit(session)); } catch { setWarning("Unable to verify the audit chain."); } finally { setLoading(false); } }
  async function doExport(format: "json" | "markdown") { if (!session) return; setLoading(true); try { setExported(await exportAudit(session, format)); } catch { setWarning(`Unable to export ${format.toUpperCase()}.`); } finally { setLoading(false); } }
  function reset() { setSession(null); setVerification(null); setWarning(null); setPendingRetry(null); setExported(null); setReplayIndex(null); attempted.current = null; }

  const replayEvent = session && replayIndex !== null ? session.events[replayIndex] : null;
  const replayStateVersion = replayEvent?.state_transition.after_state_version ?? session?.initial_state.state_version ?? 0;
  return (
    <section aria-labelledby="audit-heading" className="rounded-2xl border border-sky-300/20 bg-sky-300/[0.035] p-5 sm:p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-sky-300">Phase 7 · tamper-evident observer</p><h2 id="audit-heading" className="mt-2 text-2xl font-semibold">Audit &amp; Read-Only Replay</h2>
      <p className="mt-3 text-sm text-zinc-400">Records completed typed results as a stateless HMAC-linked chain. It never invokes the operation being recorded.</p>
      {!session ? <button type="button" onClick={() => void start()} disabled={!contract || !controlledState || loading} className="mt-5 rounded-lg bg-sky-300 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:bg-zinc-700">{loading ? "Starting…" : "Start Audit Session"}</button> : <>
        <div className="mt-5 flex flex-wrap gap-3 text-sm"><span className="rounded-full border border-white/10 px-3 py-2">Integrity: {verification?.integrity_status ?? session.integrity_status}</span><span className="rounded-full border border-white/10 px-3 py-2">Session: {session.session_id}</span><span className="rounded-full border border-white/10 px-3 py-2">Events: {session.event_count}</span></div>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void verify()} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Verify Audit Chain</button><button type="button" onClick={() => void doExport("json")} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Export JSON</button><button type="button" onClick={() => void doExport("markdown")} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Export Markdown</button><button type="button" onClick={reset} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Reset Audit Session</button></div>
        {verification?.integrity_status === "invalid" && <p role="alert" className="mt-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">Audit integrity invalid at event {verification.first_invalid_sequence ?? "unknown"}.</p>}
        <section className="mt-6"><h3 className="font-semibold">Chronological event timeline</h3><ol className="mt-3 space-y-3">{session.events.map((event) => <li key={event.event_id} className="rounded-lg border border-white/10 p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{event.sequence_number}. {event.event_type.replaceAll("_", " ")}</strong><span>{event.phase} · {event.actor}</span></div><p className="mt-2 text-zinc-300">{event.summary}</p><p className="mt-1 text-xs text-zinc-500">Reference: {event.references.action_id ?? event.references.evaluation_id ?? event.references.recovery_plan_id ?? "session"} · Status: {event.decision_or_status ?? "n/a"} · State {event.state_transition.before_state_version ?? "—"} → {event.state_transition.after_state_version ?? "—"}</p><p className="mt-1 text-xs text-zinc-500">Rules: {event.policy_rule_ids.join(", ") || "none"}</p><p className="mt-1 font-mono text-[10px] text-zinc-600">prev {preview(event.previous_event_hash)} · current {preview(event.current_event_hash)}</p><details className="mt-2"><summary className="cursor-pointer text-xs">Redacted payload summary</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-500">{JSON.stringify(event.redacted_payload_summary, null, 2)}</pre></details></li>)}</ol></section>
        <section className="mt-6 rounded-xl border border-white/10 p-4"><h3 className="font-semibold">Read-only session replay</h3><p className="mt-2 text-sm font-medium text-sky-100">Replay is read-only. No action is being executed.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setReplayIndex(0)} className="rounded border border-white/15 px-3 py-2 text-xs">Start Replay</button><button type="button" onClick={() => setReplayIndex((value) => value === null ? 0 : Math.max(0, value - 1))} disabled={replayIndex === null} className="rounded border border-white/15 px-3 py-2 text-xs disabled:opacity-40">Previous Event</button><button type="button" onClick={() => setReplayIndex((value) => value === null ? 0 : Math.min(session.events.length - 1, value + 1))} disabled={replayIndex === null} className="rounded border border-white/15 px-3 py-2 text-xs disabled:opacity-40">Next Event</button><button type="button" onClick={() => setReplayIndex(null)} className="rounded border border-white/15 px-3 py-2 text-xs">Pause</button><button type="button" onClick={() => setReplayIndex(0)} className="rounded border border-white/15 px-3 py-2 text-xs">Restart Replay</button></div>{replayEvent && <div aria-live="polite" className="mt-4 text-sm"><p>Replay position {replayIndex! + 1} of {session.events.length}</p><p className="mt-1">{replayEvent.summary} · {replayEvent.actor} · {replayEvent.phase}</p><p className="mt-1 text-zinc-400">Reconstructed read-only state version: {replayStateVersion}</p></div>}</section>
        {verification && <section aria-label="Audit outcome summary" className="mt-6 rounded-xl border border-sky-300/20 p-4 text-sm"><h3 className="font-semibold">Outcome summary</h3><p className="mt-2">Original goal: {verification.outcome.original_goal}</p><p>Unsafe actions blocked: {verification.outcome.unsafe_actions_blocked} · Approvals requested: {verification.outcome.approvals_requested} · Executed: {verification.outcome.controlled_actions_executed} · Recovery steps: {verification.outcome.recovery_steps_executed}</p><p>Final state version: {verification.outcome.final_state_version} · Completion: {verification.outcome.completion}</p><p className="mt-2 text-zinc-400">{verification.outcome.safety_summary}</p></section>}
      </>}
      {warning && <p role="alert" className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{warning}</p>}
      {pendingRetry && session && <button type="button" onClick={() => void record(pendingRetry, session)} className="mt-3 rounded-lg border border-amber-300/30 px-4 py-2 text-sm">Retry recording completed artifact</button>}
      {exported && <div className="mt-4 rounded-lg border border-white/10 p-3 text-sm"><a download={exported.filename} href={`data:${exported.media_type};charset=utf-8,${encodeURIComponent(exported.content)}`} className="text-sky-200">Download {exported.filename}</a><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-zinc-500">{exported.content}</pre></div>}
    </section>
  );
}
