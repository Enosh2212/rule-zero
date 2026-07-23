"use client";

import { useReducer, useState } from "react";
import Link from "next/link";

import { TaskContractPanel } from "../../contracts/components/task-contract-panel";
import type { TaskContract } from "../../contracts/types";
import { SafeActionGatePanel } from "../../action-gate/components/safe-action-gate-panel";
import { buildEvaluationContext } from "../../interceptor/context";
import { RuleZeroInterceptorPanel } from "../../interceptor/components/rule-zero-interceptor-panel";
import type { ActionEvaluationResponse } from "../../interceptor/types";
import type { ActionExecutionResponse, ControlledShoppingState } from "../../action-gate/types";
import { SafeRecoveryPanel } from "../../recovery/components/safe-recovery-panel";
import { AuditReplayPanel } from "../../audit/components/audit-replay-panel";
import type { AuditArtifact, AuditArtifactType } from "../../audit/types";
import { WorkerAgentPanel } from "../../worker/components/worker-agent-panel";
import type { ProposedAgentAction } from "../../worker/types";

import { applyCartAction, initialCartState } from "../cart";
import { calculateCartTotals, formatInr } from "../pricing";
import { shoppingTrapScenario } from "../scenario";
import { CartCheckout } from "./cart-checkout";
import { EvidenceDrawer } from "./evidence-drawer";
import { ProductCatalogue } from "./product-catalogue";

export function ShoppingStorefront() {
  const [cart, dispatch] = useReducer(applyCartAction, initialCartState);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [taskContract, setTaskContract] = useState<TaskContract | null>(null);
  const [latestProposal, setLatestProposal] = useState<ProposedAgentAction | null>(null);
  const [latestEvaluation, setLatestEvaluation] = useState<ActionEvaluationResponse | null>(null);
  const [controlledState, setControlledState] = useState<ControlledShoppingState | null>(null);
  const [latestExecution, setLatestExecution] = useState<ActionExecutionResponse | null>(null);
  const [latestAuditArtifact, setLatestAuditArtifact] = useState<AuditArtifact | null>(null);
  const totals = calculateCartTotals(shoppingTrapScenario, cart);
  const evaluationContext = latestProposal ? buildEvaluationContext(latestProposal, cart) : null;

  function observe(artifact_type: AuditArtifactType, artifact: object, key: string) {
    setLatestAuditArtifact({ artifact_type, artifact, artifact_key: `${artifact_type}:${key}` });
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <header className="border-b border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="/" className="font-semibold tracking-[0.2em]">RULE ZERO</Link>
          <div className="flex items-center gap-3 text-xs"><span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-violet-200">Phase 3 · proposal protocol</span><span className="text-zinc-500">No real checkout</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <section className="mb-10 grid gap-7 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">{shoppingTrapScenario.merchantName}</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">A safe-looking store with unsafe defaults.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">Manually inspect a deterministic shopping flow containing four reproducible attack conditions. Rule Zero interception is intentionally reserved for a later phase.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-4"><span className="block text-xs text-zinc-500">Example user budget</span><span className="mt-1 block text-2xl font-semibold">{formatInr(shoppingTrapScenario.exampleBudget)}</span></div>
        </section>

        <TaskContractPanel onContractChange={setTaskContract} />

        <div className="mt-8"><WorkerAgentPanel onProposalChange={(proposal) => { setLatestProposal(proposal); if (proposal) observe("worker_proposal", proposal, proposal.action_id); }} /></div>

        <div className="mt-8"><RuleZeroInterceptorPanel proposedAction={latestProposal} contract={taskContract} context={evaluationContext} onEvaluationChange={(evaluation) => { setLatestEvaluation(evaluation); observe("evaluation", evaluation, evaluation.evaluation_id); }} /></div>

        <div className="mt-8"><SafeActionGatePanel proposedAction={latestProposal} contract={taskContract} evaluation={latestEvaluation} controlledState={controlledState} onStateChange={setControlledState} onExecutionChange={setLatestExecution} onAuditArtifact={(type, response) => observe(type, response, `${response.execution_id}:${response.status}`)} /></div>

        <div className="mt-8"><SafeRecoveryPanel proposedAction={latestProposal} contract={taskContract} evaluation={latestEvaluation} executionResponse={latestExecution} controlledState={controlledState} onStateChange={setControlledState} onPlanGenerated={(plan) => observe("recovery_plan", plan, plan.recovery_plan_id)} onRecoveryExecution={(response) => observe("recovery_execution_response", response, `${response.recovery_plan_id}:${response.executed_step_index}:${response.step_status}`)} onApprovalResponse={(response) => observe("approval_response", response, `${response.execution_id}:${response.status}`)} /></div>

        <div className="mt-8"><AuditReplayPanel contract={taskContract} controlledState={controlledState} latestArtifact={latestAuditArtifact} /></div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8"><ProductCatalogue products={shoppingTrapScenario.products} quantities={cart.quantities} dispatch={dispatch} /><EvidenceDrawer scenario={shoppingTrapScenario} /></div>
          <CartCheckout scenario={shoppingTrapScenario} cart={cart} totals={totals} checkoutOpen={checkoutOpen} onCheckoutOpenChange={setCheckoutOpen} dispatch={dispatch} />
        </div>
      </div>
    </main>
  );
}
